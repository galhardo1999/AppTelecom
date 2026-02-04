/**
 * Middleware de Rate Limiting
 * Suporta armazenamento em memória ou Redis (via cache)
 */

import { Context, Next } from 'hono';
import type { RateLimitConfig, RateLimitEntry, JWTPayload } from '../types/index.js';

// Armazenamento em memória (fallback)
// NOTA: Para escala horizontal, configure Upstash Redis via UPSTASH_REDIS_URL
const rateLimitStore = new Map<string, RateLimitEntry>();

// Limpar entradas expiradas periodicamente
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 60000);

/**
 * Factory de rate limiter
 */
export function rateLimiter(config: RateLimitConfig) {
    return async (c: Context, next: Next) => {
        // Obter identificador do cliente
        const user = c.get('user') as JWTPayload | undefined;
        const forwardedFor = c.req.header('x-forwarded-for');
        const clientIp = forwardedFor?.split(',')[0]?.trim();
        const clientId = user?.userId || clientIp || 'unknown';

        const now = Date.now();
        const key = `ratelimit:${clientId}:${c.req.path}`;

        let entry = rateLimitStore.get(key);

        if (!entry || now > entry.resetTime) {
            entry = {
                count: 1,
                resetTime: now + config.windowMs
            };
            rateLimitStore.set(key, entry);
        } else {
            entry.count++;
        }

        // Headers de rate limit
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
 * Rate limiter para tentativas de login (mais restrito)
 */
export const loginRateLimiter = rateLimiter({
    windowMs: 60 * 1000,  // 1 minuto
    maxRequests: 10       // 10 tentativas por minuto
});

/**
 * Rate limiter padrão para API
 */
export const apiRateLimiter = rateLimiter({
    windowMs: 60 * 1000,  // 1 minuto
    maxRequests: 60       // 60 requisições por minuto
});
