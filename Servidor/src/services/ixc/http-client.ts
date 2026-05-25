/**
 * HTTP Client para API IXC
 * Instância única do axios configurada para todas as operações IXC
 */

import axios, { AxiosInstance } from 'axios';
import { Buffer } from 'buffer';
import { IXC_HOST, IXC_TIMEOUT_MS, IXC_TOKEN, isDevelopment } from '../../config/env.js';

// Cabeçalho de Basic Auth
const authHeader = `Basic ${Buffer.from(IXC_TOKEN).toString('base64')}`;

/**
 * Cliente axios para operações de leitura (listar)
 */
export const ixcClient = axios.create({
    baseURL: IXC_HOST,
    timeout: IXC_TIMEOUT_MS,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ixcsoft': 'listar',
    },
});

/**
 * Cliente axios para operações de escrita (atualizar)
 */
export const ixcUpdateClient = axios.create({
    baseURL: IXC_HOST,
    timeout: IXC_TIMEOUT_MS,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ixcsoft': 'atualizar',
    },
});

function aplicarTratamentoDeErro(cliente: AxiosInstance, operacao: string) {
    cliente.interceptors.response.use(
        (response) => response,
        (error) => {
            if (axios.isAxiosError(error)) {
                const endpoint = error.config?.url || 'endpoint desconhecido';
                const status = error.response?.status;

                if (error.code === 'ECONNABORTED') {
                    error.message = `IXC excedeu ${IXC_TIMEOUT_MS}ms em ${operacao} ${endpoint}`;
                } else if (!error.response) {
                    error.message = `Falha de conexão com IXC em ${operacao} ${endpoint}`;
                } else if (status === 401) {
                    error.message = 'IXC recusou autenticação do webservice';
                } else if (status && status >= 500) {
                    error.message = `IXC indisponível ou instável em ${operacao} ${endpoint}`;
                }
            }

            return Promise.reject(error);
        }
    );
}

aplicarTratamentoDeErro(ixcClient, 'listar');
aplicarTratamentoDeErro(ixcUpdateClient, 'atualizar');

/**
 * Logger que só imprime em desenvolvimento
 */
export function debugLog(tag: string, ...args: any[]) {
    if (isDevelopment) {
        console.log(`[${tag}]`, ...args);
    }
}
