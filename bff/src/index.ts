import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authMiddleware, generateToken, JWTPayload } from './middleware/auth';
import { apiRateLimiter, loginRateLimiter } from './middleware/rateLimiter';
import { ixcService } from './services/ixc';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
    origin: '*', // In production, restrict to your app domain
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check
app.get('/', (c) => {
    return c.json({
        status: 'ok',
        service: 'Apollo Telecom BFF',
        version: '1.0.0'
    });
});

// ==========================================
// AUTH ROUTES (Public) - with strict rate limiting
// ==========================================

app.post('/auth/login', loginRateLimiter, async (c) => {
    try {
        const { email, password } = await c.req.json();

        if (!email || !password) {
            return c.json({ error: 'Email e senha são obrigatórios' }, 400);
        }

        // Find client in IXC
        const client = await ixcService.findClientByEmail(email);

        if (!client) {
            return c.json({ error: 'Email não encontrado' }, 401);
        }

        // Validate password
        if (!client.senha) {
            return c.json({ error: 'Cadastro sem senha. Contate o suporte.' }, 401);
        }

        const isValidPassword = ixcService.validatePassword(password, client.senha);

        // Fallback: check plain text (some old IXC instances)
        if (!isValidPassword && client.senha !== password) {
            return c.json({ error: 'Senha incorreta' }, 401);
        }

        // Generate JWT
        const tokenPayload: JWTPayload = {
            userId: client.id,
            email: client.hotsite_email,
            name: client.razao
        };

        const token = await generateToken(tokenPayload);

        // Return user data (without sensitive fields)
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
// PROTECTED API ROUTES
// ==========================================

// Apply auth middleware and rate limiter to all /api/* routes
app.use('/api/*', apiRateLimiter);
app.use('/api/*', authMiddleware);

// Get current user info
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

// Get open invoices
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

// Get contracts
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

// Get internet usage
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

// Get PIX code for invoice
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

// Get Boleto PDF
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

// ==========================================
// START SERVER
// ==========================================

const port = parseInt(process.env.PORT || '3000');

console.log(`🚀 Apollo Telecom BFF running on http://localhost:${port}`);

export default {
    port,
    fetch: app.fetch,
};
