import axios from 'axios';
import { Buffer } from 'buffer';
import CryptoJS from 'crypto-js';

const IXC_HOST = process.env.IXC_HOST!;
const IXC_TOKEN = process.env.IXC_TOKEN!;

// Create Basic Auth Header (same logic as original app)
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

            if (status) {
                gridParams.push({ "TB": "fn_areceber.status", "OP": "=", "P": status });
            }

            const response = await ixcClient.post('/fn_areceber', {
                qtype: 'fn_areceber.id_cliente',
                query: clientId,
                oper: '=',
                page: '1',
                rp: '100',
                sortname: 'fn_areceber.data_vencimento',
                sortorder: 'desc',
                ...(gridParams.length > 0 && { grid_param: JSON.stringify(gridParams) })
            });

            const invoices = response.data?.registros || [];

            // Classify invoices by status for frontend convenience
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            return invoices.map((inv: any) => {
                const dueDate = new Date(inv.data_vencimento);
                dueDate.setHours(0, 0, 0, 0);

                let classification = inv.status;
                // If status is 'A' (Aberto) but past due date, mark as overdue
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
     * Get client contracts
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

            return response.data?.registros || [];
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
            // First try with radusuarios (plural) - newer IXC versions
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

            // Map the response to include consumption fields
            return registros.map((item: any) => ({
                id: item.id,
                id_cliente: item.id_cliente,
                login: item.login,
                senha: item.senha,
                ip: item.ip,
                mac: item.mac,
                online: item.online,
                status: item.status,
                // Consumption fields
                consumo: item.consumo || '0',           // Download total
                consumo_upload: item.consumo_upload || '0', // Upload total
                consumo_diario: item.consumo_diario || '0', // Daily consumption
                // Traffic fields (alternative names)
                rx: item.rx || item.consumo || '0',
                tx: item.tx || item.consumo_upload || '0',
                // ONU/OLT signal levels
                onu_rx: item.onu_rx || item.sinal_onu || '',
                onu_tx: item.onu_tx || '',
                olt_rx: item.olt_rx || item.sinal_olt || '',
                olt_tx: item.olt_tx || '',
                // Connection info
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
     */
    getPixCode: async (invoiceId: string): Promise<string | null> => {
        try {
            const response = await ixcClient.post('/get_pix', {
                id_areceber: invoiceId
            });

            if (response.data) {
                if (typeof response.data === 'string') return response.data;
                if (response.data.pix_copia_cola) return response.data.pix_copia_cola;
                if (response.data.qrcode) return response.data.qrcode;
                if (response.data.codigo) return response.data.codigo;
                if (response.data.registros?.[0]) {
                    const reg = response.data.registros[0];
                    return reg.pix_copia_cola || reg.qrcode || reg.codigo || null;
                }
            }
            return null;
        } catch (error) {
            console.error('IXC getPixCode error:', error);
            throw error;
        }
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
    }
};
