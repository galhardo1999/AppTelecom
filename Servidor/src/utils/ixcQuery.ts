/**
 * Helper para queries padronizadas do IXC
 * Reduz código repetido nas chamadas à API IXC
 */

import { ixcClient } from '../services/ixc/http-client.js';
import type { IXCQueryParams } from '../types/index.js';

// Re-exportar o client para uso externo, se necessário
export { ixcClient };

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
