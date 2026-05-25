/**
 * Serviço IXC — Operações de Faturas
 */

import { ixcClient, debugLog } from './http-client.js';
import type { IXCInvoice } from '../../types/index.js';
import { descreverErroSeguro } from '../../utils/sanitizar.js';

const LIMITE_FATURAS_ABERTAS = '50';
const LIMITE_HISTORICO_FATURAS = '300';

/**
 * Função auxiliar para extrair código PIX de diferentes formatos de resposta da API IXC
 */
const extractPixCode = (data: any): string | null => {
    if (!data) return null;

    // Handle IXC's actual response format: { pix: { dadosPix: "...", qrCode: { qrcode: "..." } } }
    if (data.pix) {
        const pixData = data.pix;

        if (pixData.qrCode?.qrcode && typeof pixData.qrCode.qrcode === 'string' && pixData.qrCode.qrcode.trim() !== '') {
            return pixData.qrCode.qrcode;
        }

        if (pixData.dadosPix && typeof pixData.dadosPix === 'string' && pixData.dadosPix.trim() !== '') {
            return pixData.dadosPix;
        }

        if (typeof pixData === 'string' && pixData.trim() !== '') {
            return pixData;
        }
    }

    // Direct string response
    if (typeof data === 'string' && data.trim() !== '' && data.length > 20) {
        return data;
    }

    // Legacy and common field names
    if (data.pix_copia_cola && data.pix_copia_cola.trim() !== '') return data.pix_copia_cola;
    if (data.qrcode && data.qrcode.trim() !== '') return data.qrcode;
    if (data.codigo && data.codigo.trim() !== '') return data.codigo;
    if (data.dadosPix && data.dadosPix.trim() !== '') return data.dadosPix;
    if (data.qrcode_pix && data.qrcode_pix.trim() !== '') return data.qrcode_pix;
    if (data.emv && data.emv.trim() !== '') return data.emv;

    // Array response format
    if (data.registros && Array.isArray(data.registros) && data.registros.length > 0) {
        const reg = data.registros[0];
        return reg.pix_copia_cola || reg.qrcode || reg.codigo || reg.dadosPix || null;
    }

    return null;
};

function classificarFatura(inv: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(inv.data_vencimento);
    dueDate.setHours(0, 0, 0, 0);

    let classification = inv.status;

    if (['P', 'R', 'L'].includes(inv.status)) {
        classification = 'P';
    }

    if (inv.status === 'A' && dueDate < today) {
        classification = 'V';
    }

    return {
        ...inv,
        status_original: inv.status,
        status_classificado: classification
    };
}

/**
 * Buscar faturas em aberto
 */
export async function getOpenInvoices(clientId: string) {
    try {
        const response = await ixcClient.post('/fn_areceber', {
            qtype: 'fn_areceber.id_cliente',
            query: clientId,
            oper: '=',
            page: '1',
            rp: LIMITE_FATURAS_ABERTAS,
            sortname: 'fn_areceber.data_vencimento',
            sortorder: 'asc',
            grid_param: JSON.stringify([{ "TB": "fn_areceber.status", "OP": "=", "P": "A" }])
        });

        return response.data?.registros || [];
    } catch (error) {
        console.error('IXC getOpenInvoices error:', descreverErroSeguro(error));
        throw error;
    }
}

/**
 * Buscar uma fatura por ID para validação de propriedade.
 */
export async function getInvoiceById(invoiceId: string): Promise<IXCInvoice | null> {
    try {
        const response = await ixcClient.post('/fn_areceber', {
            qtype: 'fn_areceber.id',
            query: invoiceId,
            oper: '=',
            page: '1',
            rp: '1'
        });

        return response.data?.registros?.[0] || null;
    } catch (error) {
        console.error('IXC getInvoiceById error:', descreverErroSeguro(error));
        throw error;
    }
}

/**
 * Buscar todas as faturas do cliente (abertas, pagas, vencidas)
 * @param status - Opcional: 'A' (Aberto), 'P' (Pago), 'V' (Vencido), ou undefined para todas
 */
export async function getAllInvoices(clientId: string, status?: 'A' | 'P' | 'V') {
    try {
        const gridParams: any[] = [];

        if (status === 'A') {
            gridParams.push({ "TB": "fn_areceber.status", "OP": "=", "P": status });
        }

        const response = await ixcClient.post('/fn_areceber', {
            qtype: 'fn_areceber.id_cliente',
            query: clientId,
            oper: '=',
            page: '1',
            rp: LIMITE_HISTORICO_FATURAS,
            sortname: 'fn_areceber.data_vencimento',
            sortorder: 'desc',
            ...(gridParams.length > 0 && { grid_param: JSON.stringify(gridParams) })
        });

        const invoices = response.data?.registros || [];

        const classificados = invoices.map(classificarFatura);

        if (status) {
            return classificados.filter((inv: any) => inv.status_classificado === status);
        }

        return classificados;
    } catch (error) {
        console.error('IXC getAllInvoices error:', descreverErroSeguro(error));
        throw error;
    }
}

/**
 * Buscar faturas pagas (status P, R = Recebido, L = Liquidado)
 */
export async function getPaidInvoices(clientId: string) {
    try {
        const allInvoices = await getAllInvoices(clientId);
        const paidInvoices = allInvoices.filter((inv: any) => {
            const hasPaymentDate = inv.data_pagamento && inv.data_pagamento !== '0000-00-00';
            return inv.status_classificado === 'P' || hasPaymentDate;
        });

        // Ordenar por data de pagamento (mais recente primeiro)
        paidInvoices.sort((a: any, b: any) => {
            const dateA = new Date(a.data_pagamento || a.data_vencimento);
            const dateB = new Date(b.data_pagamento || b.data_vencimento);
            return dateB.getTime() - dateA.getTime();
        });

        return paidInvoices.map((inv: any) => ({
            ...inv,
            status_classificado: 'P'
        }));
    } catch (error) {
        console.error('IXC getPaidInvoices error:', descreverErroSeguro(error));
        throw error;
    }
}

/**
 * Obter código PIX para uma fatura
 * Tenta múltiplos endpoints para compatibilidade com diferentes versões do IXC
 */
export async function getPixCode(invoiceId: string): Promise<string | null> {
    debugLog('PIX', `Fetching PIX for invoice: ${invoiceId}`);

    // Method 1: gerar_pix
    try {
        debugLog('PIX', 'Trying gerar_pix endpoint...');
        const response = await ixcClient.post('/gerar_pix', {
            id_areceber: invoiceId,
            boletos: invoiceId
        });

        debugLog('PIX', 'gerar_pix response received');
        const pixCode = extractPixCode(response.data);
        if (pixCode) return pixCode;
    } catch (error: any) {
        debugLog('PIX', 'gerar_pix endpoint failed:', error.message);
    }

    // Method 2: getpix_cob
    try {
        debugLog('PIX', 'Trying getpix_cob endpoint...');
        const response = await ixcClient.post('/getpix_cob', {
            id_areceber: invoiceId
        });

        debugLog('PIX', 'getpix_cob response received');
        const pixCode = extractPixCode(response.data);
        if (pixCode) return pixCode;
    } catch (error: any) {
        debugLog('PIX', 'getpix_cob endpoint failed:', error.message);
    }

    // Method 3: get_pix
    try {
        debugLog('PIX', 'Trying get_pix endpoint...');
        const response = await ixcClient.post('/get_pix', {
            id_areceber: invoiceId
        });

        debugLog('PIX', 'get_pix response received');
        const pixCode = extractPixCode(response.data);
        if (pixCode) return pixCode;
    } catch (error: any) {
        debugLog('PIX', 'get_pix endpoint failed:', error.message);
    }

    // Method 4: Buscar fatura diretamente
    try {
        debugLog('PIX', 'Trying direct invoice lookup...');
        const response = await ixcClient.post('/fn_areceber', {
            qtype: 'fn_areceber.id',
            query: invoiceId,
            oper: '=',
            page: '1',
            rp: '1'
        });

        debugLog('PIX', 'fn_areceber response received');

        if (response.data?.registros?.[0]) {
            const invoice = response.data.registros[0];
            if (invoice.pix_copia_cola && invoice.pix_copia_cola.trim() !== '') {
                return invoice.pix_copia_cola;
            }
            if (invoice.pix && invoice.pix.trim() !== '') {
                return invoice.pix;
            }
            if (invoice.qrcode_pix && invoice.qrcode_pix.trim() !== '') {
                return invoice.qrcode_pix;
            }
        }
    } catch (error) {
        console.error('[PIX] Direct invoice lookup failed:', descreverErroSeguro(error));
    }

    // Method 5: get_boleto com opção PIX
    try {
        debugLog('PIX', 'Trying get_boleto with PIX option...');
        const response = await ixcClient.post('/get_boleto', {
            boletos: invoiceId,
            juro: 'N',
            multa: 'N',
            atualiza_boleto: 'N',
            tipo_boleto: 'pix'
        });

        debugLog('PIX', 'get_boleto PIX response received');
        const pixCode = extractPixCode(response.data);
        if (pixCode) return pixCode;
    } catch (error: any) {
        debugLog('PIX', 'get_boleto PIX endpoint failed:', error.message);
    }

    debugLog('PIX', 'All methods failed, returning null');
    return null;
}

/**
 * Obter PDF do boleto em base64
 */
export async function getBoleto(boletoId: string): Promise<string | null> {
    try {
        const response = await ixcClient.post('/get_boleto', {
            boletos: boletoId,
            juro: 'N',
            multa: 'N',
            atualiza_boleto: 'N',
            tipo_boleto: 'arquivo',
            base64: 'S'
        });

        if (response.data) {
            if (typeof response.data === 'string' && response.data.startsWith('JVBER')) {
                return response.data;
            }
            return response.data.base64 || response.data.arquivo || response.data.pdf || response.data.boleto || null;
        }
        return null;
    } catch (error) {
        console.error('IXC getBoleto error:', descreverErroSeguro(error));
        throw error;
    }
}
