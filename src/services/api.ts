import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const BFF_URL = process.env.EXPO_PUBLIC_BFF_URL || 'http://localhost:3000';

// Create axios instance pointing to BFF
const api = axios.create({
    baseURL: BFF_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 seconds
});

// Token management
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
    accessToken = token;
};

export const getAccessToken = () => accessToken;

// Request interceptor - add JWT token to all requests
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        // Try to get token from memory first, then from SecureStore
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

// Response interceptor - handle auth errors
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Token expired or invalid - clear stored token
            accessToken = null;
            await SecureStore.deleteItemAsync('access_token');
            await SecureStore.deleteItemAsync('user_session');

            // The app will detect this and redirect to login
            // through AuthContext
        }
        return Promise.reject(error);
    }
);

// ==========================================
// AUTH API
// ==========================================

export const authApi = {
    login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },
};

// ==========================================
// PROTECTED API (requires JWT)
// ==========================================

export const bffApi = {
    // Get current user info
    getUser: async () => {
        const response = await api.get('/api/user');
        return response.data;
    },

    // Get open invoices
    getOpenInvoices: async (clientId?: string) => {
        const response = await api.get('/api/invoices');
        return response.data;
    },

    // Get client contracts
    getClientContracts: async (clientId?: string) => {
        const response = await api.get('/api/contracts');
        return response.data;
    },

    // Get invoice history (all invoices grouped by status)
    getInvoiceHistory: async () => {
        const response = await api.get('/api/invoices/history');
        return response.data;
    },

    // Get internet usage
    getInternetUsage: async (clientId?: string) => {
        const response = await api.get('/api/usage');
        return response.data;
    },

    // Get PIX code for an invoice
    getPixCode: async (invoiceId: string): Promise<string | null> => {
        try {
            const response = await api.post(`/api/pix/${invoiceId}`);
            return response.data?.pixCode || null;
        } catch (error) {
            console.error('Error fetching PIX code:', error);
            return null;
        }
    },

    // Get Boleto PDF in base64
    getBoleto: async (boletoId: string): Promise<string | null> => {
        try {
            const response = await api.post(`/api/boleto/${boletoId}`);
            return response.data?.base64 || null;
        } catch (error) {
            console.error('Error fetching boleto:', error);
            return null;
        }
    },
};

// Legacy export for compatibility
export const ixcApi = bffApi;

export default api;
