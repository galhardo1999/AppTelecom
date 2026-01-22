import { Context, Next } from 'hono';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

export interface JWTPayload {
    userId: string;
    email: string;
    name: string;
}

/**
 * Generate JWT token
 */
export async function generateToken(payload: JWTPayload): Promise<string> {
    const expiresIn = process.env.JWT_EXPIRES_IN || '1h';

    // Analisar tempo de expiração
    let expirationTime = '1h';
    if (expiresIn.endsWith('h')) {
        expirationTime = expiresIn;
    } else if (expiresIn.endsWith('d')) {
        expirationTime = expiresIn;
    }

    const token = await new jose.SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expirationTime)
        .sign(JWT_SECRET);

    return token;
}

/**
 * Verify JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jose.jwtVerify(token, JWT_SECRET);
        return payload as unknown as JWTPayload;
    } catch (error) {
        console.error('JWT verification failed:', error);
        return null;
    }
}

/**
 * Auth middleware for protected routes
 */
export async function authMiddleware(c: Context, next: Next) {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Token não fornecido' }, 401);
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    if (!payload) {
        return c.json({ error: 'Token inválido ou expirado' }, 401);
    }

    // Anexar informações do usuário ao contexto
    c.set('user', payload);

    await next();
}
