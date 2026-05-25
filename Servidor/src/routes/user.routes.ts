/**
 * Rotas de Usuário
 */

import { Hono } from 'hono';
import { ixcService } from '../services/ixc/index.js';
import { withErrorHandler } from '../middleware/errorHandler.js';
import type { JWTPayload } from '../types/index.js';

type Variables = {
    user: JWTPayload;
};

const userRoutes = new Hono<{ Variables: Variables }>();

/**
 * GET /api/user
 * Obter informações do usuário atual
 */
userRoutes.get('/', withErrorHandler(
    async (c) => {
        const user = c.get('user') as JWTPayload;

        const client = await ixcService.findClientById(user.userId);

        if (!client) {
            return c.json({ error: 'Usuário não encontrado' }, 404);
        }

        const userData = { ...client };
        delete userData.senha;

        return c.json(userData);
    },
    'Erro ao buscar dados do usuário'
));

export { userRoutes };
