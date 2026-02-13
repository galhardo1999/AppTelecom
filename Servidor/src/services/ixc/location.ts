/**
 * Serviço IXC — Operações de Localização (Cidade/Estado)
 */

import { ixcClient } from './http-client.js';

/**
 * Buscar nome da cidade pelo ID
 */
export async function getCityName(cityId: string): Promise<string> {
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
}

/**
 * Buscar UF/nome do estado pelo ID
 */
export async function getStateName(stateId: string): Promise<string> {
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
}
