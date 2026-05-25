/**
 * Rotas de Faturas
 */

import { Hono } from 'hono';
import { ixcService } from '../services/ixc/index.js';
import { withErrorHandler } from '../middleware/errorHandler.js';
import { cached } from '../services/cache.js';
import type { JWTPayload, InvoiceHistoryResponse, IXCInvoice } from '../types/index.js';

type Variables = {
    user: JWTPayload;
};

const invoiceRoutes = new Hono<{ Variables: Variables }>();

function validarIdRecurso(id: string | undefined, recurso: string) {
    if (!id || !/^\d+$/.test(id)) {
        return {
            valido: false as const,
            erro: { error: `${recurso} inválida` },
        };
    }

    return { valido: true as const, id };
}

/**
 * GET /api/invoices
 * Obter faturas em aberto
 */
invoiceRoutes.get('/', withErrorHandler(
    async (c) => {
        const user = c.get('user') as JWTPayload;

        // Cache de 1 minuto para faturas abertas
        const invoices = await cached(
            `invoices:open:${user.userId}`,
            () => ixcService.getOpenInvoices(user.userId),
            60
        );

        return c.json(invoices);
    },
    'Erro ao buscar faturas'
));

/**
 * GET /api/invoices/history
 * Obter histórico de todas as faturas
 */
invoiceRoutes.get('/history', withErrorHandler(
    async (c) => {
        const user = c.get('user') as JWTPayload;

        // Cache de 2 minutos para histórico
        const historico = await cached<IXCInvoice[]>(
            `invoices:history:${user.userId}`,
            () => ixcService.getAllInvoices(user.userId),
            120
        );

        const grouped: InvoiceHistoryResponse = {
            abertas: historico.filter((inv) => inv.status_classificado === 'A'),
            vencidas: historico.filter((inv) => inv.status_classificado === 'V'),
            pagas: historico.filter((inv) => inv.status_classificado === 'P'),
            all: historico
        };

        return c.json(grouped);
    },
    'Erro ao buscar histórico de faturas'
));

/**
 * POST /api/pix/:invoiceId
 * Obter código PIX para uma fatura
 */
invoiceRoutes.post('/pix/:invoiceId', withErrorHandler(
    async (c) => {
        const user = c.get('user') as JWTPayload;
        const validacao = validarIdRecurso(c.req.param('invoiceId'), 'Fatura');
        if (!validacao.valido) {
            return c.json(validacao.erro, 400);
        }
        const invoiceId = validacao.id;

        const invoice = await ixcService.getInvoiceById(invoiceId);
        if (!invoice) {
            return c.json({ error: 'Fatura não encontrada' }, 404);
        }
        if (invoice.id_cliente !== user.userId) {
            return c.json({ error: 'Acesso negado: fatura não pertence ao usuário' }, 403);
        }

        // PIX não deve ser cacheado (pode mudar)
        const pixCode = await ixcService.getPixCode(invoiceId);

        if (!pixCode) {
            return c.json({ error: 'Código PIX não disponível' }, 404);
        }

        return c.json({ pixCode });
    },
    'Erro ao buscar código PIX'
));

/**
 * POST /api/boleto/:invoiceId
 * Obter PDF do boleto
 */
invoiceRoutes.post('/boleto/:invoiceId', withErrorHandler(
    async (c) => {
        const user = c.get('user') as JWTPayload;
        const validacao = validarIdRecurso(c.req.param('invoiceId'), 'Fatura');
        if (!validacao.valido) {
            return c.json(validacao.erro, 400);
        }
        const invoiceId = validacao.id;

        const invoice = await ixcService.getInvoiceById(invoiceId);
        if (!invoice) {
            return c.json({ error: 'Fatura não encontrada' }, 404);
        }
        if (invoice.id_cliente !== user.userId) {
            return c.json({ error: 'Acesso negado: fatura não pertence ao usuário' }, 403);
        }

        // Boleto pode ser cacheado por 5 minutos
        const base64Pdf = await cached(
            `boleto:${invoiceId}`,
            () => ixcService.getBoleto(invoiceId),
            300
        );

        if (!base64Pdf) {
            return c.json({ error: 'Boleto não disponível' }, 404);
        }

        return c.json({ base64: base64Pdf });
    },
    'Erro ao buscar boleto'
));

export { invoiceRoutes };
