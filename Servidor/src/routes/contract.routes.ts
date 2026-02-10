/**
 * Rotas de Contratos
 */

import { Hono } from 'hono';
import { ixcService } from '../services/ixc.js';
import { withErrorHandler } from '../middleware/errorHandler.js';
import { cached } from '../services/cache.js';
import type { JWTPayload } from '../types/index.js';

type Variables = {
    user: JWTPayload;
};

const contractRoutes = new Hono<{ Variables: Variables }>();

/**
 * GET /api/contracts
 * Obter contratos do cliente
 */
contractRoutes.get('/', withErrorHandler(
    async (c) => {
        const user = c.get('user') as JWTPayload;

        // Cache de 5 minutos para contratos
        const contracts = await cached(
            `contracts:${user.userId}`,
            () => ixcService.getContracts(user.userId),
            300
        );

        return c.json(contracts);
    },
    'Erro ao buscar contratos'
));

/**
 * GET /api/usage
 * Obter consumo de internet
 */
contractRoutes.get('/usage', withErrorHandler(
    async (c) => {
        const user = c.get('user') as JWTPayload;

        // Cache de 1 minuto para consumo (muda frequentemente)
        const usage = await cached(
            `usage:${user.userId}`,
            () => ixcService.getInternetUsage(user.userId),
            60
        );

        return c.json(usage);
    },
    'Erro ao buscar consumo'
));

/**
 * POST /api/contract/:contractId
 * Obter PDF do contrato
 */
contractRoutes.post('/:contractId', withErrorHandler(
    async (c) => {
        const contractId = c.req.param('contractId');

        // Cache de 1 hora para PDF de contrato
        const base64Pdf = await cached(
            `contract-pdf:${contractId}`,
            () => ixcService.getContractPdf(contractId),
            3600
        );

        if (!base64Pdf) {
            return c.json({ error: 'Contrato PDF não disponível' }, 404);
        }

        return c.json({ base64: base64Pdf });
    },
    'Erro ao buscar contrato'
));

/**
 * PUT /api/contracts/:contractId/recurring-card
 * Atualizar contrato com cartão recorrente
 */
contractRoutes.put('/:contractId/recurring-card', async (c) => {
    try {
        const contractId = c.req.param('contractId');
        const body = await c.req.json();

        const { token, bandeira } = body;

        // Validar campos obrigatórios
        if (!token || !bandeira) {
            return c.json({
                error: 'Campos obrigatórios: token, bandeira'
            }, 400);
        }

        // Validar bandeira aceita
        const bandeirasValidas = ['visa', 'mastercard', 'elo', 'amex', 'hipercard', 'diners'];
        if (!bandeirasValidas.includes(bandeira.toLowerCase())) {
            return c.json({
                error: `Bandeira inválida. Aceitas: ${bandeirasValidas.join(', ')}`
            }, 400);
        }

        // Atualizar contrato no IXC
        const result = await ixcService.updateContractRecurringCard(contractId, {
            token,
            bandeira: bandeira.toLowerCase()
        });

        return c.json({
            success: true,
            message: 'Cartão recorrente cadastrado com sucesso',
            contractId,
            data: result
        });
    } catch (error: any) {
        console.error('[RECURRING-CARD] Error:', error.response?.data || error.message);
        const ixcError = error.response?.data?.message || error.message || 'Erro desconhecido';
        return c.json({
            error: 'Erro ao cadastrar cartão recorrente',
            details: ixcError
        }, 500);
    }
});

export { contractRoutes };
