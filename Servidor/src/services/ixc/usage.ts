/**
 * Serviço IXC — Operações de Consumo de Internet
 */

import { ixcClient, debugLog } from './http-client.js';
import { descreverErroSeguro } from '../../utils/sanitizar.js';

function mapearUsoInternet(item: any) {
    return {
        id: item.id,
        id_cliente: item.id_cliente,
        login: item.login,
        ip: item.ip,
        mac: item.mac,
        online: item.online,
        status: item.status,
        // Campos de consumo
        consumo: item.consumo || '0',
        consumo_upload: item.consumo_upload || '0',
        consumo_diario: item.consumo_diario || '0',
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
    };
}

/**
 * Buscar dados de consumo de internet (radusuarios)
 * Fields: consumo (download), consumo_upload, consumo_diario
 */
export async function getInternetUsage(clientId: string) {
    try {
        // Tentar com radusuarios (plural) - versões mais recentes do IXC
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

        return registros.map(mapearUsoInternet);
    } catch (error: any) {
        // Fallback para radusuario (singular) em versões mais antigas do IXC
        debugLog('USAGE', 'Trying fallback to /radusuario...');
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

            const registrosFallback = fallbackResponse.data?.registros || [];
            return registrosFallback.map(mapearUsoInternet);
        } catch (fallbackError) {
            console.error('IXC getInternetUsage error (both endpoints failed):', descreverErroSeguro(error));
            throw error;
        }
    }
}
