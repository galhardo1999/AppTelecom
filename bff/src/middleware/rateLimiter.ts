import { Context, Next } from 'hono';

interface RateLimitConfig {
    windowMs: number;      // Time window in milliseconds
    maxRequests: number;   // Max requests per window
}

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory store (for production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 60000); // Clean every minute

/**
 * Rate limiter middleware factory
 */
export function rateLimiter(config: RateLimitConfig) {
    return async (c: Context, next: Next) => {
        // Get client identifier (IP or user ID from JWT)
        const user = c.get('user');
        const clientId = user?.userId || c.req.header('x-forwarded-for') || 'unknown';

        const now = Date.now();
        const key = `${clientId}:${c.req.path}`;

        let entry = rateLimitStore.get(key);

        if (!entry || now > entry.resetTime) {
            // Create new entry
            entry = {
                count: 1,
                resetTime: now + config.windowMs
            };
            rateLimitStore.set(key, entry);
        } else {
            entry.count++;
        }

        // Set rate limit headers
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
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5            // 5 login attempts per 15 min
});

/**
 * Standard rate limiter for API requests
 */
export const apiRateLimiter = rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60      // 60 requests per minute
});
