import axios from 'axios';
import { Buffer } from 'buffer';
import CryptoJS from 'crypto-js';
import { IXC_HOST, IXC_TOKEN } from '../config/env.js';

// Criar cabeçalho de Basic Auth
const authHeader = `Basic ${Buffer.from(IXC_TOKEN).toString('base64')}`;

const ixcClient = axios.create({
    baseURL: IXC_HOST,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ixcsoft': 'listar',
    },
});

export interface IXCClient {
    id: string;
    razao: string;
    hotsite_email: string;
    senha?: string;
    endereco?: string;
    [key: string]: any;
}

/**
 * Função auxiliar para extrair código PIX de diferentes formatos de resposta da API IXC
 */
const extractPixCode = (data: any): string | null => {
    if (!data) return null;

    // Handle IXC's actual response format: { pix: { dadosPix: "...", qrCode: { qrcode: "..." } } }
    if (data.pix) {
        const pixData = data.pix;

        // Prioritize QRCode as it appeared correct in tests
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

export const ixcService = {
    /**
     * Find client by hotsite_email
     */
    findClientByEmail: async (email: string): Promise<IXCClient | null> => {
        try {
            const response = await ixcClient.post('/cliente', {
                qtype: 'cliente.hotsite_email',
                query: email,
                oper: '=',
                page: '1',
                rp: '1',
                sortname: 'cliente.id',
                sortorder: 'desc'
            });

            if (response.data?.registros?.length > 0) {
                return response.data.registros[0];
            }
            return null;
        } catch (error) {
            console.error('IXC findClientByEmail error:', error);
            throw error;
        }
    },

    /**
     * Validate password using MD5 (IXC standard)
     */
    validatePassword: (inputPassword: string, storedHash: string): boolean => {
        const inputHash = CryptoJS.MD5(inputPassword).toString();
        return inputHash === storedHash;
    },

    /**
     * Get open invoices for a client
     */
    getOpenInvoices: async (clientId: string) => {
        try {
            const response = await ixcClient.post('/fn_areceber', {
                qtype: 'fn_areceber.id_cliente',
                query: clientId,
                oper: '=',
                page: '1',
                rp: '50',
                sortname: 'fn_areceber.data_vencimento',
                sortorder: 'asc',
                grid_param: JSON.stringify([{ "TB": "fn_areceber.status", "OP": "=", "P": "A" }])
            });

            return response.data?.registros || [];
        } catch (error) {
            console.error('IXC getOpenInvoices error:', error);
            throw error;
        }
    },

    /**
     * Get all invoices for a client (including paid, open, overdue)
     * @param status - Optional: 'A' (Aberto), 'P' (Pago), 'V' (Vencido), or undefined for all
     */
    getAllInvoices: async (clientId: string, status?: 'A' | 'P' | 'V') => {
        try {
            const gridParams: any[] = [];

            // Para faturas pagas, usar filtro específico que exclui status C e R
            if (status === 'P') {
                gridParams.push({ "TB": "fn_areceber.status", "OP": "!=", "P": "C" });
                gridParams.push({ "TB": "fn_areceber.status", "OP": "!=", "P": "R" });
                gridParams.push({ "TB": "fn_areceber.status", "OP": "=", "P": "P" });
            } else if (status) {
                gridParams.push({ "TB": "fn_areceber.status", "OP": "=", "P": status });
            }

            const response = await ixcClient.post('/fn_areceber', {
                qtype: 'fn_areceber.id_cliente',
                query: clientId,
                oper: '=',
                page: '1',
                rp: '200000',
                sortname: 'fn_areceber.data_vencimento',
                sortorder: 'desc',
                ...(gridParams.length > 0 && { grid_param: JSON.stringify(gridParams) })
            });

            const invoices = response.data?.registros || [];

            // Classificar faturas por status para conveniência do frontend
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            return invoices.map((inv: any) => {
                const dueDate = new Date(inv.data_vencimento);
                dueDate.setHours(0, 0, 0, 0);

                let classification = inv.status;

                // Normalizar status de pagamento (R = Recebido, L = Liquidado -> P = Pago)
                if (['R', 'L'].includes(inv.status)) {
                    classification = 'P';
                }

                // Se status é 'A' (Aberto) mas passou da data de vencimento, marcar como vencido
                if (inv.status === 'A' && dueDate < today) {
                    classification = 'V'; // Vencido
                }

                return {
                    ...inv,
                    status_original: inv.status,
                    status_classificado: classification
                };
            });
        } catch (error) {
            console.error('IXC getAllInvoices error:', error);
            throw error;
        }
    },

    /**
     * Get paid invoices for a client (status P or R - Recebido/Pago)
     * No IXC: status 'P' = Pago, status 'R' pode significar Recebido em algumas versões
     * Também tentamos buscar status 'L' (Liquidado)
     */
    getPaidInvoices: async (clientId: string) => {
        try {
            // Buscar todas as faturas do cliente
            const allResponse = await ixcClient.post('/fn_areceber', {
                qtype: 'fn_areceber.id_cliente',
                query: clientId,
                oper: '=',
                rp: '200000',
                sortname: 'fn_areceber.data_vencimento',
                sortorder: 'desc'
            });

            const allInvoices = allResponse.data?.registros || [];

            // Filtrar faturas pagas localmente
            // Status possíveis para "pago": P, R (Recebido), L (Liquidado)
            const paidStatuses = ['P', 'R', 'L'];
            const paidInvoices = allInvoices.filter((inv: any) => {
                const isPaid = paidStatuses.includes(inv.status);
                // Também verificar se tem data de pagamento
                const hasPaymentDate = inv.data_pagamento && inv.data_pagamento !== '0000-00-00';
                return isPaid || hasPaymentDate;
            });

            // Ordenar por data de pagamento (mais recente primeiro)
            paidInvoices.sort((a: any, b: any) => {
                const dateA = new Date(a.data_pagamento || a.data_vencimento);
                const dateB = new Date(b.data_pagamento || b.data_vencimento);
                return dateB.getTime() - dateA.getTime();
            });

            // Adicionar classificação para consistência com outras faturas
            return paidInvoices.map((inv: any) => ({
                ...inv,
                status_original: inv.status,
                status_classificado: 'P' // Todas são pagas
            }));
        } catch (error) {
            console.error('IXC getPaidInvoices error:', error);
            throw error;
        }
    },

    /**
     * Get city name by ID
     */
    getCityName: async (cityId: string): Promise<string> => {
        try {
            if (!cityId) return '';
            const response = await ixcClient.post('/cidade', {
                qtype: 'cidade.id',
                query: cityId,
                oper: '=',
            });
            const city = response.data?.registros?.[0];
            return city?.nome || '';
        } catch (error) {
            console.error('IXC getCityName error:', error);
            return '';
        }
    },

    /**
     * Get state name by ID
     */
    getStateName: async (stateId: string): Promise<string> => {
        try {
            if (!stateId) return '';
            const response = await ixcClient.post('/estado', {
                qtype: 'estado.id',
                query: stateId,
                oper: '=',
            });
            const state = response.data?.registros?.[0];
            return state?.uf || state?.nome || '';
        } catch (error) {
            console.error('IXC getStateName error:', error);
            return '';
        }
    },

    /**
     * Get client contracts with full address data
     * Prioriza endereço do contrato, usa dados do cliente como fallback
     */
    getContracts: async (clientId: string) => {
        try {
            const response = await ixcClient.post('/cliente_contrato', {
                qtype: 'cliente_contrato.id_cliente',
                query: clientId,
                oper: '=',
                page: '1',
                rp: '10',
                sortname: 'cliente_contrato.id',
                sortorder: 'desc'
            });

            const contracts = response.data?.registros || [];

            // Buscar dados do cliente como fallback para endereço
            const clientResponse = await ixcClient.post('/cliente', {
                qtype: 'cliente.id',
                query: clientId,
                oper: '=',
            });
            const clientData = clientResponse.data?.registros?.[0];

            // Processar cada contrato com busca de cidade/estado específica
            const processedContracts = await Promise.all(contracts.map(async (contract: any) => {
                // Usar endereço do contrato com prioridade, cliente como fallback
                const endereco = contract.endereco || clientData?.endereco || '';
                const numero = contract.numero || clientData?.numero || '';
                const bairro = contract.bairro || clientData?.bairro || '';

                // Usar cidade/estado do contrato se disponível e válido, senão do cliente
                // Nota: verificar se não é vazio ou '0' antes de usar
                const cidadeId = (contract.cidade && contract.cidade !== '0' && contract.cidade !== '')
                    ? contract.cidade
                    : clientData?.cidade;
                const estadoId = (contract.estado && contract.estado !== '0' && contract.estado !== '')
                    ? contract.estado
                    : clientData?.estado;

                let cidadeNome = '';
                let estadoNome = '';

                if (cidadeId) {
                    cidadeNome = await ixcService.getCityName(cidadeId);
                }
                if (estadoId) {
                    estadoNome = await ixcService.getStateName(estadoId);
                }

                return {
                    ...contract,
                    descricao_aux_plano_venda: contract.descricao_aux_plano_venda || '',
                    endereco,
                    numero,
                    bairro,
                    cidade: cidadeNome,
                    cidadeId: cidadeId, // ID da cidade para o modal promocional
                    estado: estadoNome,
                };
            }));

            return processedContracts;
        } catch (error) {
            console.error('IXC getContracts error:', error);
            throw error;
        }
    },

    /**
     * Get internet usage data from radusuarios table
     * Fields: consumo (download), consumo_upload, consumo_diario
     */
    getInternetUsage: async (clientId: string) => {
        try {
            // Primeiro tentar com radusuarios (plural) - versões mais recentes do IXC
            const response = await ixcClient.post('/radusuarios', {
                qtype: 'radusuarios.id_cliente',
                query: clientId,
                oper: '=',
                page: '1',
                rp: '20',
                sortname: 'radusuarios.id',
                sortorder: 'desc'
            });

            const registros = response.data?.registros || [];

            // Mapear a resposta para incluir campos de consumo
            return registros.map((item: any) => ({
                id: item.id,
                id_cliente: item.id_cliente,
                login: item.login,
                senha: item.senha,
                ip: item.ip,
                mac: item.mac,
                online: item.online,
                status: item.status,
                // Campos de consumo
                consumo: item.consumo || '0',           // Download total
                consumo_upload: item.consumo_upload || '0', // Upload total
                consumo_diario: item.consumo_diario || '0', // Consumo diário
                // Campos de tráfego (nomes alternativos)
                rx: item.rx || item.consumo || '0',
                tx: item.tx || item.consumo_upload || '0',
                // Níveis de sinal ONU/OLT
                onu_rx: item.onu_rx || item.sinal_onu || '',
                onu_tx: item.onu_tx || '',
                olt_rx: item.olt_rx || item.sinal_olt || '',
                olt_tx: item.olt_tx || '',
                // Informações de conexão
                tempo_online: item.tempo_online || item.uptime || '',
                ultima_conexao: item.ultima_conexao || item.ultimo_acesso || '',
                id_conexao: item.id_conexao || ''
            }));
        } catch (error: any) {
            // Fallback to radusuario (singular) for older IXC versions
            console.log('Trying fallback to /radusuario...');
            try {
                const fallbackResponse = await ixcClient.post('/radusuario', {
                    qtype: 'radusuario.id_cliente',
                    query: clientId,
                    oper: '=',
                    page: '1',
                    rp: '20',
                    sortname: 'radusuario.id',
                    sortorder: 'desc'
                });

                return fallbackResponse.data?.registros || [];
            } catch (fallbackError) {
                console.error('IXC getInternetUsage error (both endpoints failed):', error);
                throw error;
            }
        }
    },

    /**
     * Get PIX code for invoice
     * Tries multiple methods to ensure compatibility with different IXC versions:
     * 1. gerar_pix - Endpoint para gerar novo PIX
     * 2. getpix_cob - Endpoint de cobrança PIX
     * 3. get_pix - Endpoint padrão de algumas versões
     * 4. fn_areceber - Busca direta na fatura pelo campo pix_copia_cola
     */
    getPixCode: async (invoiceId: string): Promise<string | null> => {
        console.log(`[PIX] Fetching PIX for invoice: ${invoiceId}`);

        // Method 1: Try gerar_pix endpoint (IXC versions with PIX generation)
        try {
            console.log('[PIX] Trying gerar_pix endpoint...');
            const response = await ixcClient.post('/gerar_pix', {
                id_areceber: invoiceId,
                boletos: invoiceId
            });

            console.log('[PIX] gerar_pix response:', JSON.stringify(response.data));

            const pixCode = extractPixCode(response.data);
            if (pixCode) return pixCode;
        } catch (error: any) {
            console.log('[PIX] gerar_pix endpoint failed:', error.message);
        }

        // Method 2: Try getpix_cob endpoint (PIX billing endpoint)
        try {
            console.log('[PIX] Trying getpix_cob endpoint...');
            const response = await ixcClient.post('/getpix_cob', {
                id_areceber: invoiceId
            });

            console.log('[PIX] getpix_cob response:', JSON.stringify(response.data));

            const pixCode = extractPixCode(response.data);
            if (pixCode) return pixCode;
        } catch (error: any) {
            console.log('[PIX] getpix_cob endpoint failed:', error.message);
        }

        // Method 3: Try the get_pix endpoint (some IXC versions)
        try {
            console.log('[PIX] Trying get_pix endpoint...');
            const response = await ixcClient.post('/get_pix', {
                id_areceber: invoiceId
            });

            console.log('[PIX] get_pix response:', JSON.stringify(response.data));

            const pixCode = extractPixCode(response.data);
            if (pixCode) return pixCode;
        } catch (error: any) {
            console.log('[PIX] get_pix endpoint failed:', error.message);
        }

        // Method 4: Try fetching the invoice directly to get pix_copia_cola field
        try {
            console.log('[PIX] Trying direct invoice lookup...');
            const response = await ixcClient.post('/fn_areceber', {
                qtype: 'fn_areceber.id',
                query: invoiceId,
                oper: '=',
                page: '1',
                rp: '1'
            });

            console.log('[PIX] fn_areceber response:', JSON.stringify(response.data));

            if (response.data?.registros?.[0]) {
                const invoice = response.data.registros[0];
                // Verificar múltiplos campos possíveis
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
            console.error('[PIX] Direct invoice lookup failed:', error);
        }

        // Method 5: Try get_boleto with PIX option
        try {
            console.log('[PIX] Trying get_boleto with PIX option...');
            const response = await ixcClient.post('/get_boleto', {
                boletos: invoiceId,
                juro: 'N',
                multa: 'N',
                atualiza_boleto: 'N',
                tipo_boleto: 'pix'
            });

            console.log('[PIX] get_boleto PIX response:', JSON.stringify(response.data));

            const pixCode = extractPixCode(response.data);
            if (pixCode) return pixCode;
        } catch (error: any) {
            console.log('[PIX] get_boleto PIX endpoint failed:', error.message);
        }

        console.log('[PIX] All methods failed, returning null');
        return null;
    },

    /**
     * Get Boleto PDF in base64
     */
    getBoleto: async (boletoId: string): Promise<string | null> => {
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
            console.error('IXC getBoleto error:', error);
            throw error;
        }
    },

    /**
     * Get Contract PDF in base64
     */
    getContractPdf: async (contractId: string): Promise<string | null> => {
        try {
            console.log(`[CONTRACT] Fetching PDF for contract: ${contractId}`);

            const response = await ixcClient.post('/cliente_contrato_imprimir_contrato_17678', {
                id: contractId
            });

            console.log('[CONTRACT] Response type:', typeof response.data);

            if (response.data) {
                // Verificar se já é uma string PDF em base64
                if (typeof response.data === 'string' && response.data.startsWith('JVBER')) {
                    return response.data;
                }
                // Tentar formatos comuns de resposta
                return response.data.base64 || response.data.arquivo || response.data.pdf || response.data.contrato || null;
            }
            return null;
        } catch (error) {
            console.error('IXC getContractPdf error:', error);
            throw error;
        }
    }
};
