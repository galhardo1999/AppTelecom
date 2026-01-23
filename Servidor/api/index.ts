import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handle } from 'hono/vercel';
import { authMiddleware, generateToken, JWTPayload } from '../src/middleware/auth';
import { apiRateLimiter, loginRateLimiter } from '../src/middleware/rateLimiter';
import { ixcService } from '../src/services/ixc';

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

// Verificação de saúde
app.get('/', (c) => {
    return c.json({
        status: 'ok',
        service: 'Apollo Telecom BFF',
        version: '1.0.0',
        environment: 'vercel'
    });
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
