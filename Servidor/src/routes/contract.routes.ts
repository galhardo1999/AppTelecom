/**
 * Rotas de Contratos
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { ixcService } from '../services/ixc/index.js';
import { cieloService } from '../services/cielo.js';
import { withErrorHandler } from '../middleware/errorHandler.js';
import { cached, invalidarCache } from '../services/cache.js';
import { recurringCardSchema, validateBody } from '../middleware/validators.js';
import type { JWTPayload } from '../types/index.js';

type Variables = {
    user: JWTPayload;
};

const contractRoutes = new Hono<{ Variables: Variables }>();

function validarIdRecurso(id: string | undefined, recurso: string) {
    if (!id || !/^\d+$/.test(id)) {
        return {
            valido: false as const,
            erro: { error: `${recurso} inválido` },
        };
    }

    return { valido: true as const, id };
}

async function validarContratoDoUsuario(contractId: string, user: JWTPayload) {
    const contrato = await ixcService.getContractById(contractId);
    if (!contrato) {
        return {
            autorizado: false as const,
            status: 404 as const,
            erro: { error: 'Contrato não encontrado' },
        };
    }

    if (contrato.id_cliente !== user.userId) {
        return {
            autorizado: false as const,
            status: 403 as const,
            erro: { error: 'Acesso negado: contrato não pertence ao usuário' },
        };
    }

    return { autorizado: true as const, contrato };
}

function obterIpCliente(c: Context<{ Variables: Variables }>) {
    const encaminhado = c.req.header('x-forwarded-for');
    return encaminhado?.split(',')[0]?.trim()
        || c.req.header('x-real-ip')
        || 'IP não identificado';
}

async function invalidarCacheDoCliente(userId: string, contractId: string) {
    await invalidarCache([
        `contracts:${userId}`,
        `contract-pdf:${contractId}`,
        `usage:${userId}`,
        `invoices:open:${userId}`,
        `invoices:history:${userId}`,
        `invoices:all:${userId}`,
        `invoices:paid:${userId}`,
    ]);
}

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
        const user = c.get('user') as JWTPayload;
        const validacao = validarIdRecurso(c.req.param('contractId'), 'Contrato');
        if (!validacao.valido) {
            return c.json(validacao.erro, 400);
        }
        const contractId = validacao.id;

        const autorizacao = await validarContratoDoUsuario(contractId, user);
        if (!autorizacao.autorizado) {
            return c.json(autorizacao.erro, autorizacao.status);
        }

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
        const user = c.get('user') as JWTPayload;
        const validacaoId = validarIdRecurso(c.req.param('contractId'), 'Contrato');
        if (!validacaoId.valido) {
            return c.json(validacaoId.erro, 400);
        }
        const contractId = validacaoId.id;

        const autorizacao = await validarContratoDoUsuario(contractId, user);
        if (!autorizacao.autorizado) {
            return c.json(autorizacao.erro, autorizacao.status);
        }

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
        await ixcService.updateContractRecurringCard(contractId, {
            ultimosDigitos: cardNumber.replace(/\D/g, '').slice(-4),
            holder: customerName || holder,
            expirationDate,
            brand: brand.toLowerCase(),
            token: cardToken,
        });
        await invalidarCacheDoCliente(user.userId, contractId);

        return c.json({
            success: true,
            message: 'Cartão recorrente cadastrado com sucesso',
            contractId
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
        const user = c.get('user') as JWTPayload;
        const validacao = validarIdRecurso(c.req.param('contractId'), 'Contrato');
        if (!validacao.valido) {
            return c.json(validacao.erro, 400);
        }
        const contractId = validacao.id;

        const autorizacao = await validarContratoDoUsuario(contractId, user);
        if (!autorizacao.autorizado) {
            return c.json(autorizacao.erro, autorizacao.status);
        }

        await ixcService.deleteRecurringCard(contractId);
        await invalidarCacheDoCliente(user.userId, contractId);

        return c.json({
            success: true,
            message: 'Cartão recorrente removido com sucesso'
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
        const user = c.get('user') as JWTPayload;
        const validacao = validarIdRecurso(c.req.param('contractId'), 'Contrato');
        if (!validacao.valido) {
            return c.json(validacao.erro, 400);
        }
        const contractId = validacao.id;

        const autorizacao = await validarContratoDoUsuario(contractId, user);
        if (!autorizacao.autorizado) {
            return c.json(autorizacao.erro, autorizacao.status);
        }

        const body = await c.req.json().catch(() => ({})) as { userAgent?: unknown };

        // 2. Server-side Data Generation for Integrity
        const ip = obterIpCliente(c);
        const userAgent = typeof body.userAgent === 'string' && body.userAgent.length <= 500
            ? body.userAgent
            : c.req.header('user-agent') || 'App Mobile';
        const timestamp = new Date().toISOString();

        const result = await ixcService.acceptContract(contractId, {
            ip,
            userAgent,
            timestamp
        });
        await invalidarCacheDoCliente(user.userId, contractId);

        return c.json({
            success: true,
            message: 'Contrato aceito com sucesso',
            data: result
        });
    },
    'Erro ao aceitar contrato'
));

export { contractRoutes };
