import { Context, Next } from 'hono';

interface RateLimitConfig {
    windowMs: number;      // Janela de tempo em milissegundos
    maxRequests: number;   // Máximo de requisições por janela
}

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// Armazenamento em memória (para produção, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Limpar entradas expiradas periodicamente
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 60000); // Limpar a cada minuto

/**
 * Rate limiter middleware factory
 */
export function rateLimiter(config: RateLimitConfig) {
    return async (c: Context, next: Next) => {
        // Obter identificador do cliente (IP ou ID do usuário do JWT)
        const user = c.get('user');
        const clientId = user?.userId || c.req.header('x-forwarded-for') || 'unknown';

        const now = Date.now();
        const key = `${clientId}:${c.req.path}`;

        let entry = rateLimitStore.get(key);

        if (!entry || now > entry.resetTime) {
            // Criar nova entrada
            entry = {
                count: 1,
                resetTime: now + config.windowMs
            };
            rateLimitStore.set(key, entry);
        } else {
            entry.count++;
        }

        // Definir headers de rate limit
        c.header('X-RateLimit-Limit', config.maxRequests.toString());
        c.header('X-RateLimit-Remaining', Math.max(0, config.maxRequests - entry.count).toString());
        c.header('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString());

        if (entry.count > config.maxRequests) {
            const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
            c.header('Retry-After', retryAfter.toString());

            return c.json({
                error: 'Muitas requisições. Tente novamente em alguns segundos.',
                retryAfter
            }, 429);
        }

        await next();
    };
}

/**
 * Stricter rate limiter for login attempts (prevent brute force)
 */
export const loginRateLimiter = rateLimiter({
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 30      // 30 tentativas por minuto (Aumentado para testes)
});

/**
 * Standard rate limiter for API requests
 */
export const apiRateLimiter = rateLimiter({
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 60      // 60 requisições por minuto
});
