/**
 * Helper para queries padronizadas do IXC
 * Reduz código repetido nas chamadas à API IXC
 */

import axios from 'axios';
import { Buffer } from 'buffer';
import { IXC_HOST, IXC_TOKEN } from '../config/env.js';
import type { IXCQueryParams } from '../types/index.js';

// Criar cabeçalho de Basic Auth
const authHeader = `Basic ${Buffer.from(IXC_TOKEN).toString('base64')}`;

// Cliente axios configurado para IXC
export const ixcClient = axios.create({
    baseURL: IXC_HOST,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ixcsoft': 'listar',
    },
});

/**
 * Executa uma query padronizada no IXC
 * @param params Parâmetros da query
 * @returns Array de registros encontrados
 */
export async function queryIXC<T>(params: IXCQueryParams): Promise<T[]> {
    const response = await ixcClient.post(`/${params.table}`, {
        qtype: `${params.table}.${params.field}`,
        query: params.value,
        oper: '=',
        page: String(params.page || 1),
        rp: String(params.limit || 50),
        sortname: `${params.table}.${params.sortField || params.field}`,
        sortorder: params.sortOrder || 'desc',
        ...(params.gridParams && params.gridParams.length > 0 && {
            grid_param: JSON.stringify(params.gridParams)
        })
    });

    return response.data?.registros || [];
}

/**
 * Busca um único registro no IXC
 * @param params Parâmetros da query
 * @returns Primeiro registro encontrado ou null
 */
export async function queryIXCOne<T>(params: Omit<IXCQueryParams, 'limit'>): Promise<T | null> {
    const results = await queryIXC<T>({ ...params, limit: 1 });
    return results.length > 0 ? results[0] : null;
}
