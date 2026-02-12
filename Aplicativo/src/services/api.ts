import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const BFF_URL = process.env.EXPO_PUBLIC_BFF_URL || 'http://localhost:3000';

// Callback simples para erros de auth 401 (compatível com React Native)
let onUnauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorized = (callback: (() => void) | null) => {
    onUnauthorizedCallback = callback;
};

// Criar instância do axios apontando para o BFF
const api = axios.create({
    baseURL: BFF_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 seconds
});

// Gerenciamento de token
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
    accessToken = token;
};

export const getAccessToken = () => accessToken;

// Interceptador de requisição - adicionar token JWT em todas as requisições
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        // Tentar obter token da memória primeiro, depois do SecureStore
        let token = accessToken;

        if (!token) {
            token = await SecureStore.getItemAsync('access_token');
            if (token) {
                accessToken = token;
            }
        }

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptador de resposta - tratar erros de auth
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Token expirado ou inválido - limpar token armazenado
            accessToken = null;
            await SecureStore.deleteItemAsync('access_token');
            await SecureStore.deleteItemAsync('user_session');

            // Chamar o callback para que o AuthContext possa atualizar o estado
            if (onUnauthorizedCallback) {
                onUnauthorizedCallback();
            }
        }
        return Promise.reject(error);
    }
);

// ==========================================
// API DE AUTENTICAÇÃO
// ==========================================

export const authApi = {
    login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },
};

// ==========================================
// API PROTEGIDA (requer JWT)
// ==========================================

export const bffApi = {
    // Obter informações do usuário atual
    getUser: async () => {
        const response = await api.get('/api/user');
        return response.data;
    },

    // Obter faturas em aberto
    getOpenInvoices: async () => {
        const response = await api.get('/api/invoices');
        return response.data;
    },

    // Obter contratos do cliente
    getClientContracts: async () => {
        const response = await api.get('/api/contracts');
        return response.data;
    },

    // Obter histórico de faturas (todas as faturas agrupadas por status)
    getInvoiceHistory: async () => {
        const response = await api.get('/api/invoices/history');
        return response.data;
    },

    // Obter consumo de internet
    getInternetUsage: async () => {
        const response = await api.get('/api/contracts/usage');
        return response.data;
    },

    // Obter código PIX para uma fatura
    getPixCode: async (invoiceId: string): Promise<string | null> => {
        try {
            const response = await api.post(`/api/invoices/pix/${invoiceId}`);
            return response.data?.pixCode || null;
        } catch (error) {
            console.error('Error fetching PIX code:', error);
            return null;
        }
    },

    // Obter PDF do boleto em base64
    getBoleto: async (boletoId: string): Promise<string | null> => {
        try {
            // Note: invoiceId is passed as boletoId in the frontend call typically, 
            // but the backend expects /api/invoices/boleto/:invoiceId
            const response = await api.post(`/api/invoices/boleto/${boletoId}`);
            return response.data?.base64 || null;
        } catch (error) {
            console.error('Error fetching boleto:', error);
            return null;
        }
    },

    // Obter PDF do contrato em base64
    getContractPdf: async (contractId: string): Promise<string | null> => {
        try {
            const response = await api.post(`/api/contracts/${contractId}`);
            return response.data?.base64 || null;
        } catch (error) {
            console.error('Error fetching contract PDF:', error);
            return null;
        }
    },

    // Cadastrar cartão recorrente no contrato (tokenização via Cielo no backend)
    setupRecurringCard: async (contractId: string, cardData: {
        cardNumber: string;
        holder: string;
        expirationDate: string;
        securityCode: string;
        brand: string;
        customerName?: string;
    }) => {
        console.log('[BFF API] Enviando requisição para setupRecurringCard:', { contractId, ...cardData });
        const response = await api.put(`/api/contracts/${contractId}/recurring-card`, cardData);
        console.log('[BFF API] Resposta de setupRecurringCard:', response.data);
        return response.data;
    },

    deleteRecurringCard: async (contractId: string) => {
        const response = await api.delete(`/api/contracts/${contractId}/recurring-card`);
        return response.data;
    },
};

// Export legado para compatibilidade
export const ixcApi = bffApi;

export default api;
