/**
 * HTTP Client para API IXC
 * Instância única do axios configurada para todas as operações IXC
 */

import axios from 'axios';
import { Buffer } from 'buffer';
import { IXC_HOST, IXC_TOKEN, isDevelopment } from '../../config/env.js';

// Cabeçalho de Basic Auth
const authHeader = `Basic ${Buffer.from(IXC_TOKEN).toString('base64')}`;

/**
 * Cliente axios para operações de leitura (listar)
 */
export const ixcClient = axios.create({
    baseURL: IXC_HOST,
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
    headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ixcsoft': 'atualizar',
    },
});

/**
 * Logger que só imprime em desenvolvimento
 */
export function debugLog(tag: string, ...args: any[]) {
    if (isDevelopment) {
        console.log(`[${tag}]`, ...args);
    }
}
