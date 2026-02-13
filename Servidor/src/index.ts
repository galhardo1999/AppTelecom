/**
 * Apollo Telecom BFF - Servidor Principal
 * 
 * Este servidor atua como Backend For Frontend (BFF) entre o app mobile
 * e a API do IXC, protegendo credenciais e abstraindo a complexidade.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// Configuração
import { PORT, ALLOWED_ORIGINS, isDevelopment } from './config/env.js';
import { CITY_FOLDERS } from './config/cities.js';

// Middleware
import { authMiddleware } from './middleware/auth.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { globalErrorHandler } from './middleware/errorHandler.js';

// Rotas
import { authRoutes } from './routes/auth.routes.js';
import { userRoutes } from './routes/user.routes.js';
import { invoiceRoutes } from './routes/invoice.routes.js';
import { contractRoutes } from './routes/contract.routes.js';

// Assets
import { logoBase64 } from './logoBase64.js';

// Tipagem das variáveis do contexto
import type { JWTPayload } from './types/index.js';

type Variables = {
    user: JWTPayload;
};

export const app = new Hono<{ Variables: Variables }>();

// ==========================================
// MIDDLEWARE GLOBAL
// ==========================================

// Servir arquivos estáticos apenas em desenvolvimento (Bun)
if (isDevelopment) {
    try {
        // @ts-ignore - Importação dinâmica para evitar erro de build no Node
        const { serveStatic } = await import('hono/bun');
        app.use('/image.png', serveStatic({ path: './public/image.png' }));
        app.use('/public/*', serveStatic({ root: './' }));
    } catch (e) {
        // Ignorar se não estiver no runtime Bun
    }
}

// Logger
app.use('*', logger());

// Error handler global
app.use('*', globalErrorHandler);

// CORS configurado de forma segura
app.use('*', cors({
    origin: (origin) => {
        if (!ALLOWED_ORIGINS || ALLOWED_ORIGINS.length === 0) {
            if (!isDevelopment) {
                console.warn('⚠️ CORS: Permitindo todas as origens em produção (configure ALLOWED_ORIGINS)');
            }
            return origin;
        }

        if (ALLOWED_ORIGINS.includes(origin)) {
            return origin;
        }

        return null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
}));

// Security Headers
app.use('*', async (c, next) => {
    await next();
    c.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('X-XSS-Protection', '1; mode=block');
});

// ==========================================
// LANDING PAGE
// ==========================================

app.get('/', (c) => {
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apollo Telecom - App Oficial</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --primary: #a82ee6; --secondary: #8e1cbd; --dark: #0f172a; --light: #ffffff; --bg: #faf5ff; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', system-ui, sans-serif; }
        body { background: var(--bg); color: var(--dark); display: flex; flex-direction: column; min-height: 100vh; }
        .hero { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; text-align: center; gap: 2rem; }
        h1 { font-size: 3rem; color: var(--dark); font-weight: 800; }
        p { color: #64748b; font-size: 1.2rem; max-width: 600px; line-height: 1.6; }
        .btn-group { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; }
        .btn { padding: 1rem 2rem; border-radius: 99px; text-decoration: none; font-weight: bold; transition: transform 0.2s; display: flex; align-items: center; gap: 0.5rem; color: white; border: none; }
        .btn:hover { transform: scale(1.05); filter: brightness(1.1); }
        .btn-google { background: #01875f; box-shadow: 0 4px 6px -1px rgba(1, 135, 95, 0.3); }
        .btn-apple { background: #000000; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); }
        .footer { padding: 2rem; text-align: center; color: #475569; font-size: 0.9rem; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .hero img { animation: fadeInUp 0.8s ease-out forwards; opacity: 0; }
        h1 { animation: fadeInUp 0.8s ease-out 0.2s forwards; opacity: 0; }
        p { animation: fadeInUp 0.8s ease-out 0.4s forwards; opacity: 0; }
        .btn-group { animation: fadeInUp 0.8s ease-out 0.6s forwards; opacity: 0; }
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
</html>`;
    return c.html(html);
});

// ==========================================
// ROTAS PÚBLICAS - CIDADES (imagens/banners)
// ==========================================

app.get('/cities/:cityId/images', async (c) => {
    const cityId = c.req.param('cityId');
    const folderName = CITY_FOLDERS[cityId];

    if (!folderName) {
        return c.json({ cityId, folder: null, images: ['/public/cities/default.jpg'] });
    }

    try {
        const fs = await import('fs');
        const path = await import('path');
        const cityPath = path.join(process.cwd(), 'public', 'cities', folderName);

        const files = fs.readdirSync(cityPath);
        const imageFiles = files.filter((file: string) =>
            /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
        );

        const baseUrl = '/public/cities';
        const images = imageFiles.map((file: string) =>
            `${baseUrl}/${encodeURIComponent(folderName)}/${encodeURIComponent(file)}`
        );

        return c.json({
            cityId,
            folder: folderName,
            images: images.length > 0 ? images : ['/public/cities/default.jpg']
        });
    } catch (error) {
        return c.json({ cityId, folder: folderName, images: ['/public/cities/default.jpg'] });
    }
});

app.get('/cities/:cityId/banners', async (c) => {
    const cityId = c.req.param('cityId');
    const folderName = CITY_FOLDERS[cityId];

    if (!folderName) {
        return c.json({ cityId, folder: null, banners: [] });
    }

    try {
        const fs = await import('fs');
        const path = await import('path');
        const bannerPath = path.join(process.cwd(), 'public', 'cities', folderName, 'Banner');

        if (!fs.existsSync(bannerPath)) {
            return c.json({ cityId, folder: folderName, banners: [] });
        }

        const files = fs.readdirSync(bannerPath);
        const imageFiles = files.filter((file: string) =>
            /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
        );

        const baseUrl = '/public/cities';
        const banners = imageFiles.map((file: string) =>
            `${baseUrl}/${encodeURIComponent(folderName)}/Banner/${encodeURIComponent(file)}`
        );

        return c.json({ cityId, folder: folderName, banners });
    } catch (error) {
        return c.json({ cityId, folder: folderName, banners: [] });
    }
});

// ==========================================
// ROTAS DE AUTENTICAÇÃO (Públicas)
// ==========================================

app.route('/auth', authRoutes);

// ==========================================
// ROTAS PROTEGIDAS DA API
// ==========================================

// Middleware de rate limiter + auth para TODAS as rotas /api/*
app.use('/api/*', apiRateLimiter);
app.use('/api/*', authMiddleware);

// Montar rotas protegidas
app.route('/api/user', userRoutes);
app.route('/api/invoices', invoiceRoutes);
app.route('/api/contracts', contractRoutes);

// ==========================================
// HEALTH CHECK
// ==========================================

app.get('/health', (c) => c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: isDevelopment ? 'development' : 'production'
}));

// ==========================================
// INICIAR SERVIDOR
// ==========================================

console.log(`🚀 Apollo Telecom BFF running on http://localhost:${PORT}`);

export default {
    port: PORT,
    fetch: app.fetch,
};
