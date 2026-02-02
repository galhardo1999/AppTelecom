import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handle } from 'hono/vercel';
import { authMiddleware, generateToken, JWTPayload } from '../src/middleware/auth.js';
import { apiRateLimiter, loginRateLimiter } from '../src/middleware/rateLimiter.js';
import { ixcService } from '../src/services/ixc.js';
import { logoBase64 } from '../src/logoBase64.js';

// Tipagem das variáveis do contexto
type Variables = {
    user: JWTPayload;
};

const app = new Hono<{ Variables: Variables }>().basePath('/');

// Middleware
app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
}));

// Landing Page HTML
const landingPageHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apollo Telecom - App Oficial</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary: #7c3aed;
            --secondary: #5b21b6;
            --dark: #0f172a;
            --light: #ffffff;
            --bg: #faf5ff; /* purple-50 */
        }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', system-ui, sans-serif; }
        body { background: var(--bg); color: var(--dark); display: flex; flex-direction: column; min-height: 100vh; }
        header { padding: 2rem; text-align: center; }
        .hero { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; text-align: center; gap: 2rem; }
        h1 { 
            font-size: 3rem; 
            background: linear-gradient(to right, #7c3aed, #4c1d95); 
            -webkit-background-clip: text; 
            -webkit-text-fill-color: transparent; 
            font-weight: 800;
        }
        p { color: #64748b; font-size: 1.2rem; max-width: 600px; line-height: 1.6; }
        .mockup-container { position: relative; width: 280px; margin: 2rem 0; animation: float 6s ease-in-out infinite; }
        .mockup-container img { width: 100%; border-radius: 40px; box-shadow: 0 25px 50px -12px rgba(124, 58, 237, 0.25); border: 4px solid #fff; }
        .btn-group { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; }
        .btn { padding: 1rem 2rem; border-radius: 99px; text-decoration: none; font-weight: bold; transition: transform 0.2s; display: flex; align-items: center; gap: 0.5rem; box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.3); }
        .btn-primary { background: var(--primary); color: white; }
        .btn-primary:hover { transform: scale(1.05); background: var(--secondary); }
        .footer { padding: 2rem; text-align: center; color: #475569; font-size: 0.9rem; width: 100%; display: flex; justify-content: center; align-items: center; }
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }
    </style>
</head>
<body>
    <header>
        <img src="${logoBase64}" alt="Apollo Telecom" style="height: 60px; max-width: 100%; object-fit: contain;">
    </header>
    <main class="hero">
        <div class="content">
            <h1>Sua conexão na palma da mão</h1>
            <p>Gerencie seu plano, acesse faturas e acompanhe seu consumo de internet com o novo aplicativo Apollo Telecom. Disponível para Android e iOS.</p>
        </div>
        
        <div class="mockup-container">
            <!-- Image served from public folder or Vercel static -->
            <img src="/app-mockup.png" alt="Apollo Telecom App">
        </div>

        <div class="btn-group">
            <a href="https://play.google.com/store/apps/details?id=com.galhardyn.apollotelecom" class="btn btn-primary" target="_blank">
                <i class="fa-brands fa-google-play"></i> Google Play
            </a>
            <a href="#" class="btn btn-primary">
                <i class="fa-brands fa-apple"></i> App Store
            </a>
        </div>
    </main>
    <footer class="footer">
        <p>&copy; 2026 Apollo Telecom. Todos os direitos reservados.</p>
    </footer>
</body>
</html>
`;

// Verificação de saúde
app.get('/', (c) => {
    return c.html(landingPageHTML);
});

// ==========================================
// ROTAS DE AUTENTICAÇÃO (Públicas)
// ==========================================

app.post('/auth/login', loginRateLimiter, async (c) => {
    try {
        const { email, password } = await c.req.json();

        if (!email || !password) {
            return c.json({ error: 'Email e senha são obrigatórios' }, 400);
        }

        const client = await ixcService.findClientByEmail(email);

        if (!client) {
            return c.json({ error: 'Email não encontrado' }, 401);
        }

        if (!client.senha) {
            return c.json({ error: 'Cadastro sem senha. Contate o suporte.' }, 401);
        }

        const isValidPassword = ixcService.validatePassword(password, client.senha);

        if (!isValidPassword && client.senha !== password) {
            return c.json({ error: 'Senha incorreta' }, 401);
        }

        const tokenPayload: JWTPayload = {
            userId: client.id,
            email: client.hotsite_email,
            name: client.razao
        };

        const token = await generateToken(tokenPayload);

        const userData = { ...client };
        delete userData.senha;

        return c.json({
            token,
            user: userData
        });

    } catch (error: any) {
        console.error('Login error:', error);
        return c.json({ error: 'Erro interno no servidor' }, 500);
    }
});

// ==========================================
// ROTAS PROTEGIDAS DA API
// ==========================================

app.use('/api/*', apiRateLimiter);
app.use('/api/*', authMiddleware);

app.get('/api/user', async (c) => {
    const user = c.get('user') as JWTPayload;

    try {
        const client = await ixcService.findClientByEmail(user.email);

        if (!client) {
            return c.json({ error: 'Usuário não encontrado' }, 404);
        }

        const userData = { ...client };
        delete userData.senha;

        return c.json(userData);
    } catch (error) {
        console.error('Get user error:', error);
        return c.json({ error: 'Erro ao buscar dados do usuário' }, 500);
    }
});

app.get('/api/invoices', async (c) => {
    const user = c.get('user') as JWTPayload;

    try {
        const invoices = await ixcService.getOpenInvoices(user.userId);
        return c.json(invoices);
    } catch (error) {
        console.error('Get invoices error:', error);
        return c.json({ error: 'Erro ao buscar faturas' }, 500);
    }
});

app.get('/api/invoices/history', async (c) => {
    const user = c.get('user') as JWTPayload;
    const status = c.req.query('status') as 'A' | 'P' | 'V' | undefined;

    try {
        const invoices = await ixcService.getAllInvoices(user.userId, status);

        const grouped = {
            abertas: invoices.filter((inv: any) => inv.status_classificado === 'A'),
            vencidas: invoices.filter((inv: any) => inv.status_classificado === 'V'),
            pagas: invoices.filter((inv: any) => inv.status_classificado === 'P'),
            all: invoices
        };

        return c.json(grouped);
    } catch (error) {
        console.error('Get invoices history error:', error);
        return c.json({ error: 'Erro ao buscar histórico de faturas' }, 500);
    }
});

app.get('/api/contracts', async (c) => {
    const user = c.get('user') as JWTPayload;

    try {
        const contracts = await ixcService.getContracts(user.userId);
        return c.json(contracts);
    } catch (error) {
        console.error('Get contracts error:', error);
        return c.json({ error: 'Erro ao buscar contratos' }, 500);
    }
});

app.get('/api/usage', async (c) => {
    const user = c.get('user') as JWTPayload;

    try {
        const usage = await ixcService.getInternetUsage(user.userId);
        return c.json(usage);
    } catch (error) {
        console.error('Get usage error:', error);
        return c.json({ error: 'Erro ao buscar consumo' }, 500);
    }
});

app.post('/api/pix/:invoiceId', async (c) => {
    const invoiceId = c.req.param('invoiceId');

    try {
        const pixCode = await ixcService.getPixCode(invoiceId);

        if (!pixCode) {
            return c.json({ error: 'Código PIX não disponível' }, 404);
        }

        return c.json({ pixCode });
    } catch (error) {
        console.error('Get PIX error:', error);
        return c.json({ error: 'Erro ao buscar código PIX' }, 500);
    }
});

app.post('/api/boleto/:invoiceId', async (c) => {
    const invoiceId = c.req.param('invoiceId');

    try {
        const base64Pdf = await ixcService.getBoleto(invoiceId);

        if (!base64Pdf) {
            return c.json({ error: 'Boleto não disponível' }, 404);
        }

        return c.json({ base64: base64Pdf });
    } catch (error) {
        console.error('Get boleto error:', error);
        return c.json({ error: 'Erro ao buscar boleto' }, 500);
    }
});

app.post('/api/contract/:contractId', async (c) => {
    const contractId = c.req.param('contractId');

    try {
        const base64Pdf = await ixcService.getContractPdf(contractId);

        if (!base64Pdf) {
            return c.json({ error: 'Contrato PDF não disponível' }, 404);
        }

        return c.json({ base64: base64Pdf });
    } catch (error) {
        console.error('Get contract PDF error:', error);
        return c.json({ error: 'Erro ao buscar contrato' }, 500);
    }
});

export const GET = handle(app);
export const POST = handle(app);
export const OPTIONS = handle(app);
