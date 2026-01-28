import axios from 'axios';
import { Buffer } from 'buffer';
import CryptoJS from 'crypto-js';

const IXC_HOST = process.env.IXC_HOST!;
const IXC_TOKEN = process.env.IXC_TOKEN!;

// Criar cabeçalho de Basic Auth (mesma lógica do app original)
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
            console.log('[PAID] ====================================');
            console.log('[PAID] Fetching paid invoices for client:', clientId);

            // Estratégia 1: Buscar todas as faturas do cliente para ver os status existentes
            const allResponse = await ixcClient.post('/fn_areceber', {
                qtype: 'fn_areceber.id_cliente',
                query: clientId,
                oper: '=',
                rp: '200000',
                sortname: 'fn_areceber.data_vencimento',
                sortorder: 'desc'
            });

            const allInvoices = allResponse.data?.registros || [];
            console.log('[PAID] Total de faturas do cliente:', allInvoices.length);

            // Logar todos os status únicos encontrados
            const statusCounts: { [key: string]: number } = {};
            allInvoices.forEach((inv: any) => {
                const s = inv.status || 'undefined';
                statusCounts[s] = (statusCounts[s] || 0) + 1;
            });
            console.log('[PAID] Status encontrados:', JSON.stringify(statusCounts));

            // Filtrar faturas pagas localmente
            // Status possíveis para "pago": P, R (Recebido), L (Liquidado)
            const paidStatuses = ['P', 'R', 'L'];
            const paidInvoices = allInvoices.filter((inv: any) => {
                const isPaid = paidStatuses.includes(inv.status);
                // Também verificar se tem data de pagamento
                const hasPaymentDate = inv.data_pagamento && inv.data_pagamento !== '0000-00-00';
                return isPaid || hasPaymentDate;
            });

            console.log('[PAID] Faturas pagas encontradas:', paidInvoices.length);
            if (paidInvoices.length > 0) {
                console.log('[PAID] Exemplo de fatura paga:', JSON.stringify(paidInvoices[0], null, 2));
            }
            console.log('[PAID] ====================================');

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

            // Buscar dados do cliente para pegar o endereço completo
            const clientResponse = await ixcClient.post('/cliente', {
                qtype: 'cliente.id',
                query: clientId,
                oper: '=',
            });
            const clientData = clientResponse.data?.registros?.[0];

            // Buscar nomes de cidade e estado
            let cidadeNome = '';
            let estadoNome = '';

            if (clientData?.cidade) {
                cidadeNome = await ixcService.getCityName(clientData.cidade);
            }
            if (clientData?.estado) {
                estadoNome = await ixcService.getStateName(clientData.estado);
            }

            // Adicionar dados de endereço aos contratos
            return contracts.map((contract: any) => ({
                ...contract,
                endereco: clientData?.endereco || contract.endereco || '',
                numero: clientData?.numero || '',
                bairro: clientData?.bairro || '',
                cidade: cidadeNome,
                estado: estadoNome,
            }));
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
     * Tries multiple methods: get_pix endpoint, then direct invoice lookup
     */
    getPixCode: async (invoiceId: string): Promise<string | null> => {
        console.log(`[PIX] Fetching PIX for invoice: ${invoiceId}`);

        // Method 1: Try the get_pix endpoint (some IXC versions)
        try {
            const response = await ixcClient.post('/get_pix', {
                id_areceber: invoiceId
            });

            console.log('[PIX] get_pix response:', JSON.stringify(response.data));

            if (response.data) {
                // Handle IXC's actual response format: { pix: { dadosPix: "...", qrCode: { qrcode: "..." } } }
                if (response.data.pix) {
                    const pixData = response.data.pix;
                    if (pixData.dadosPix && pixData.dadosPix.trim() !== '') {
                        return pixData.dadosPix;
                    }
                    if (pixData.qrCode?.qrcode && pixData.qrCode.qrcode.trim() !== '') {
                        return pixData.qrCode.qrcode;
                    }
                }
                // Legacy formats
                if (typeof response.data === 'string' && response.data.trim() !== '') return response.data;
                if (response.data.pix_copia_cola) return response.data.pix_copia_cola;
                if (response.data.qrcode) return response.data.qrcode;
                if (response.data.codigo) return response.data.codigo;
                if (response.data.registros?.[0]) {
                    const reg = response.data.registros[0];
                    return reg.pix_copia_cola || reg.qrcode || reg.codigo || null;
                }
            }
        } catch (error: any) {
            console.log('[PIX] get_pix endpoint failed, trying direct invoice lookup...');
        }

        // Method 2: Try fetching the invoice directly to get pix_copia_cola
        try {
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
                if (invoice.pix_copia_cola) {
                    return invoice.pix_copia_cola;
                }
            }
        } catch (error) {
            console.error('[PIX] Direct invoice lookup failed:', error);
        }

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
