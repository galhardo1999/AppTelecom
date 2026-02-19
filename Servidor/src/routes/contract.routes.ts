/**
 * Rotas de Contratos
 */

import { Hono } from 'hono';
import { ixcService } from '../services/ixc/index.js';
import { cieloService } from '../services/cielo.js';
import { withErrorHandler } from '../middleware/errorHandler.js';
import { cached } from '../services/cache.js';
import { recurringCardSchema, validateBody } from '../middleware/validators.js';
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
 * GET /api/contracts/usage
 * Obter consumo de internet
 */
contractRoutes.get('/usage', withErrorHandler(
    async (c) => {
        const user = c.get('user') as JWTPayload;

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
 * POST /api/contracts/:contractId
 * Obter PDF do contrato
 */
contractRoutes.post('/:contractId', withErrorHandler(
    async (c) => {
        const contractId = c.req.param('contractId');

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
 * Tokeniza cartão via Cielo e salva no contrato IXC
 */
contractRoutes.put('/:contractId/recurring-card', withErrorHandler(
    async (c) => {
        const contractId = c.req.param('contractId');

        // Validar input com Zod
        const validation = await validateBody(c, recurringCardSchema);
        if (!validation.success) {
            return validation.response;
        }

        const { cardNumber, holder, expirationDate, securityCode, brand, customerName } = validation.data;

        // 1. Tokenizar cartão na Cielo (com retry)
        console.log('[RECURRING-CARD] Tokenizando cartão na Cielo...');
        const cardToken = await cieloService.tokenizeCardWithRetry({
            customerName: customerName || holder,
            cardNumber,
            holder,
            expirationDate,
            brand,
            securityCode,
        });

        // 1.1 Validar se o token está ativo/acessível
        const isTokenValid = await cieloService.validateToken(cardToken);
        if (!isTokenValid) {
            throw new Error('Token gerado não pôde ser validado na Cielo');
        }

        // 2. Enviar dados do cartão + token para o IXC
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
    },
    'Erro ao cadastrar cartão recorrente'
));

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

/**
 * POST /api/contracts/:contractId/accept
 * Realiza o aceite digital do contrato
 */
contractRoutes.post('/:contractId/accept', withErrorHandler(
    async (c) => {
        const contractId = c.req.param('contractId');
        const user = c.get('user') as JWTPayload;
        const body = await c.req.json().catch(() => ({})); // Body is optional/ignored for sensitive data now

        // 1. Authorization: Verify if user owns the contract
        const userContracts = await ixcService.getContracts(user.userId);
        const ownsContract = userContracts.some((contract: any) => contract.id === contractId);

        if (!ownsContract) {
            return c.json({ error: 'Acesso negado: Contrato não pertence ao usuário' }, 403);
        }

        // 2. Server-side Data Generation for Integrity
        // Extract IP from headers (trusting proxy if behind Vercel/Nginx)
        const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'IP não identificado';
        // Use provided userAgent or fallback using headers
        const userAgent = body.userAgent || c.req.header('user-agent') || 'App Mobile';
        const timestamp = new Date().toISOString();

        const result = await ixcService.acceptContract(contractId, {
            ip,
            userAgent,
            timestamp
        });

        return c.json({
            success: true,
            message: 'Contrato aceito com sucesso',
            data: result
        });
    },
    'Erro ao aceitar contrato'
));

export { contractRoutes };
