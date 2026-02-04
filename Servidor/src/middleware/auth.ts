/**
 * Middleware de Autenticação JWT
 */

import { Context, Next } from 'hono';
import * as jose from 'jose';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/env.js';
import type { JWTPayload } from '../types/index.js';

// Chave secreta para JWT
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

// Re-exportar o tipo para uso nas rotas
export type { JWTPayload };

/**
 * Gera um token JWT
 */
export async function generateToken(payload: JWTPayload): Promise<string> {
    const token = await new jose.SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(JWT_EXPIRES_IN)
        .sign(SECRET_KEY);

    return token;
}

/**
 * Verifica um token JWT
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jose.jwtVerify(token, SECRET_KEY);
        return payload as unknown as JWTPayload;
    } catch (error: any) {
        // Log apenas em desenvolvimento e sem expor detalhes
        if (error.code !== 'ERR_JWT_EXPIRED') {
            console.error('[AUTH] Token verification failed:', error.code || 'unknown');
        }
        return null;
    }
}

/**
 * Middleware de autenticação para rotas protegidas
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
