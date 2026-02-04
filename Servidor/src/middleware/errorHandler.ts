/**
 * Middleware de tratamento de erros centralizado
 */

import { Context, Next } from 'hono';
import { isDevelopment } from '../config/env.js';

/**
 * Wrapper para handlers de rota com tratamento de erro automático
 */
export function withErrorHandler<T>(
    handler: (c: Context) => Promise<T>,
    errorMessage: string
) {
    return async (c: Context) => {
        try {
            return await handler(c);
        } catch (error: any) {
            const errorId = Date.now().toString(36);

            // Log detalhado no servidor
            console.error(`[ERROR:${errorId}] ${errorMessage}`);
            console.error(`  Path: ${c.req.path}`);
            console.error(`  Method: ${c.req.method}`);
            console.error(`  Message: ${error.message}`);

            if (isDevelopment) {
                console.error(`  Stack: ${error.stack}`);
            }

            // Resposta ao cliente (sem detalhes sensíveis)
            return c.json({
                error: errorMessage,
                errorId: errorId
            }, 500);
        }
    };
}

/**
 * Middleware global de tratamento de erros não capturados
 */
export async function globalErrorHandler(c: Context, next: Next) {
    try {
        await next();
    } catch (error: any) {
        const errorId = Date.now().toString(36);

        console.error(`[UNHANDLED ERROR:${errorId}]`);
        console.error(`  Path: ${c.req.path}`);
        console.error(`  Message: ${error.message}`);

        return c.json({
            error: 'Erro interno no servidor',
            errorId: errorId
        }, 500);
    }
}
