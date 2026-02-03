import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authMiddleware, generateToken, JWTPayload } from './middleware/auth.js';
import { apiRateLimiter, loginRateLimiter } from './middleware/rateLimiter.js';
import { ixcService } from './services/ixc.js';
import { serveStatic } from 'hono/bun';
import { logoBase64 } from './logoBase64.js';

// Tipagem das variáveis do contexto
type Variables = {
    user: JWTPayload;
};

const app = new Hono<{ Variables: Variables }>();

// Middleware
app.use('/image.png', serveStatic({ path: './public/image.png' }));
app.use('/public/*', serveStatic({ root: './' }));
app.use('*', logger());
app.use('*', cors({
    origin: '*', // Em produção, restringir ao domínio do seu app
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
            --primary: #a82ee6;
            --secondary: #8e1cbd;
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
            color: var(--dark);
            font-weight: 800;
        }
        p { color: #64748b; font-size: 1.2rem; max-width: 600px; line-height: 1.6; }
        .btn-group { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; }
        .btn { padding: 1rem 2rem; border-radius: 99px; text-decoration: none; font-weight: bold; transition: transform 0.2s; display: flex; align-items: center; gap: 0.5rem; color: white; border: none; }
        .btn:hover { transform: scale(1.05); filter: brightness(1.1); }
        .btn-google { background: #01875f; box-shadow: 0 4px 6px -1px rgba(1, 135, 95, 0.3); }
        .btn-apple { background: #000000; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); }
        .footer { padding: 2rem; text-align: center; color: #475569; font-size: 0.9rem; width: 100%; display: flex; justify-content: center; align-items: center; }
        
        /* Animations */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .hero img { animation: fadeInUp 0.8s ease-out forwards; opacity: 0; }
        h1 { animation: fadeInUp 0.8s ease-out 0.2s forwards; opacity: 0; }
        p { animation: fadeInUp 0.8s ease-out 0.4s forwards; opacity: 0; }
        .btn-group { animation: fadeInUp 0.8s ease-out 0.6s forwards; opacity: 0; }

        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }
    </style>
</head>
<body>
    <main class="hero">
        <img src="${logoBase64}" alt="Apollo Telecom" style="height: 150px; max-width: 100%; object-fit: contain; margin-bottom: 1rem;">
        <div class="content">
            <h1>Sua conexão na palma da mão</h1>
            <p>Gerencie seu plano, acesse faturas e acompanhe seu consumo de internet com o novo aplicativo Apollo Telecom. Disponível para Android e iOS.</p>
        </div>
        
        <div class="btn-group">
            <a href="https://play.google.com/store/apps/details?id=com.galhardyn.apollotelecom" class="btn btn-google" target="_blank">
                <i class="fa-brands fa-google-play"></i> Google Play
            </a>
            <a href="#" class="btn btn-apple">
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

// Verificação de saúde (Landing Page)
app.get('/', (c) => {
    return c.html(landingPageHTML);
});

// ==========================================
// ROTAS DE AUTENTICAÇÃO (Públicas) - com rate limiting restrito
// ==========================================

app.post('/auth/login', loginRateLimiter, async (c) => {
    try {
        const { email, password } = await c.req.json();

        if (!email || !password) {
            return c.json({ error: 'Email e senha são obrigatórios' }, 400);
        }

        // Buscar cliente no IXC
        const client = await ixcService.findClientByEmail(email);

        if (!client) {
            return c.json({ error: 'Email não encontrado' }, 401);
        }

        // Verificar se cliente está ativo
        if (client.ativo === 'N') {
            return c.json({ error: 'Não foi possível acessar sua conta. Entre em contato com o suporte no número 0800 871 0606' }, 403);
        }

        // Validar senha
        if (!client.senha) {
            return c.json({ error: 'Cadastro sem senha. Contate o suporte.' }, 401);
        }

        const isValidPassword = ixcService.validatePassword(password, client.senha);

        // Fallback: verificar texto puro (algumas instâncias antigas do IXC)
        if (!isValidPassword && client.senha !== password) {
            return c.json({ error: 'Senha incorreta' }, 401);
        }

        // Gerar JWT
        const tokenPayload: JWTPayload = {
            userId: client.id,
            email: client.hotsite_email,
            name: client.razao
        };

        const token = await generateToken(tokenPayload);

        // Retornar dados do usuário (sem campos sensíveis)
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

// Aplicar middleware de auth e rate limiter para todas as rotas /api/*
app.use('/api/*', apiRateLimiter);
app.use('/api/*', authMiddleware);

// Obter informações do usuário atual
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

// Obter faturas em aberto
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

// Obter histórico de todas as faturas (abertas, pagas, vencidas)
app.get('/api/invoices/history', async (c) => {
    const user = c.get('user') as JWTPayload;

    try {
        // Buscar faturas abertas/vencidas (status != P, C, R)
        const openInvoices = await ixcService.getAllInvoices(user.userId);

        // Buscar faturas pagas separadamente com filtro específico
        const paidInvoices = await ixcService.getPaidInvoices(user.userId);

        // Agrupar faturas por classificação para facilitar o frontend
        const grouped = {
            abertas: openInvoices.filter((inv: any) => inv.status_classificado === 'A'),
            vencidas: openInvoices.filter((inv: any) => inv.status_classificado === 'V'),
            pagas: paidInvoices,
            all: [...openInvoices, ...paidInvoices]
        };

        return c.json(grouped);
    } catch (error) {
        console.error('Get invoices history error:', error);
        return c.json({ error: 'Erro ao buscar histórico de faturas' }, 500);
    }
});

// Obter contratos
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

// Obter consumo de internet
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

// Obter código PIX para fatura
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

// Obter PDF do boleto
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

// Obter PDF do contrato
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

// ==========================================
// INICIAR SERVIDOR
// ==========================================

const port = parseInt(process.env.PORT || '3000');

console.log(`🚀 Apollo Telecom BFF running on http://localhost:${port}`);

export default {
    port,
    fetch: app.fetch,
};
