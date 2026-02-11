/**
 * Rotas de Contratos
 */

import { Hono } from 'hono';
import { ixcService } from '../services/ixc.js';
import { cieloService } from '../services/cielo.js';
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
 * Envia dados do cartão direto para o IXC — IXC tokeniza via Cielo internamente
 */
contractRoutes.put('/:contractId/recurring-card', async (c) => {
    try {
        const contractId = c.req.param('contractId');
        const body = await c.req.json();

        const { cardNumber, holder, expirationDate, securityCode, brand, customerName } = body;

        // Validar campos obrigatórios
        if (!contractId || !cardNumber || !holder || !expirationDate || !securityCode || !brand) {
            return c.json({
                error: 'Campos obrigatórios: cardNumber, holder, expirationDate, securityCode, brand'
            }, 400);
        }

        // Validar bandeira aceita
        const bandeirasValidas = ['visa', 'mastercard', 'elo', 'amex', 'hipercard', 'diners'];
        if (!bandeirasValidas.includes(brand.toLowerCase())) {
            return c.json({
                error: `Bandeira inválida. Aceitas: ${bandeirasValidas.join(', ')}`
            }, 400);
        }

        // 1. Tokenizar cartão na Cielo (com retry)
        console.log('[RECURRING-CARD] Tokenizando cartão na Cielo...');
        const cardToken = await cieloService.tokenizeCardWithRetry({
            customerName: customerName || holder,
            cardNumber: cardNumber,
            holder: holder,
            expirationDate: expirationDate,
            brand: brand,
            securityCode: securityCode,
        });

        console.log('[RECURRING-CARD] Token gerado:', cardToken);

        // 1.1 Validar se o token está ativo/acessível
        const isTokenValid = await cieloService.validateToken(cardToken);
        if (!isTokenValid) {
            throw new Error('Token gerado não pôde ser validado na Cielo');
        }

        // 2. Enviar dados do cartão + token para o IXC
        console.log('[RECURRING-CARD] Enviando dados do cartão para IXC...');
        const result = await ixcService.updateContractRecurringCard(contractId, {
            cardNumber: cardNumber.replace(/\D/g, ''),
            holder: customerName || holder,
            expirationDate,
            securityCode,
            brand: brand.toLowerCase(),
            token: cardToken,
        });

        return c.json({
            success: true,
            message: 'Cartão recorrente cadastrado com sucesso',
            contractId,
            data: result
        });
    } catch (error: any) {
        console.error('[RECURRING-CARD] Error:', error.response?.data || error.message);

        const errorMessage = error.message || 'Erro desconhecido';

        // Se for erro de validação da Cielo, retornar 400
        if (errorMessage.includes('Erro Cielo') || errorMessage.includes('Credenciais da Cielo')) {
            return c.json({
                error: 'Erro na validação do cartão',
                details: errorMessage.replace('Erro Cielo: ', '')
            }, 400);
        }

        return c.json({
            error: 'Erro ao cadastrar cartão recorrente',
            details: errorMessage
        }, 500);
    }
});

/**
 * DELETE /api/contracts/:contractId/recurring-card
 * Remove o cartão recorrente do contrato
 */
contractRoutes.delete('/:contractId/recurring-card', withErrorHandler(
    async (c) => {
        const contractId = c.req.param('contractId');

        const result = await ixcService.deleteRecurringCard(contractId);

        return c.json({
            success: true,
            message: 'Cartão recorrente removido com sucesso',
            data: result
        });
    },
    'Erro ao remover cartão recorrente'
));

export { contractRoutes };
