/**
 * Serviço IXC — Operações de Contrato
 */

import { ixcClient, ixcUpdateClient, debugLog } from './http-client.js';
import { getCityName, getStateName } from './location.js';

/**
 * Campos que NÃO devem ser reenviados no PUT (causam validações indesejadas no IXC)
 */
const CAMPOS_EXCLUIR_PUT = [
    'id',
    'motivo_cancelamento', 'data_cancelamento', 'obs_cancelamento',
    'origem_cancelamento', 'id_responsavel_cancelamento',
    'motivo_desistencia', 'data_desistencia', 'obs_desistencia',
    'id_responsavel_desistencia',
    'data_negativacao', 'protocolo_negativacao', 'id_motivo_negativacao',
    'obs_negativacao', 'id_responsavel_negativacao',
    'data_cadastro_sistema', 'ultima_atualizacao',
    'status', 'status_internet', 'status_velocidade',
    'situacao_financeira_contrato', 'status_recorrencia',
    'pago_ate_data', 'num_parcelas_atraso',
    'dt_ult_bloq_auto', 'dt_ult_bloq_manual', 'dt_ult_desbloq_auto',
    'dt_ult_desbloq_manual', 'dt_ult_des_bloq_conf', 'dt_ult_ativacao',
    'dt_ult_finan_atraso', 'dt_utl_negativacao', 'dt_ult_desiste',
    'dt_ult_liberacao_susp_parc',
    'data_inicial_suspensao', 'data_final_suspensao', 'data_retomada_contrato',
    'ativacao_vencimentos',
] as const;

/**
 * Remove campos problemáticos de um payload de atualização do IXC
 */
function sanitizePayload(payload: Record<string, any>): Record<string, any> {
    const clean = { ...payload };
    for (const campo of CAMPOS_EXCLUIR_PUT) {
        delete clean[campo];
    }
    return clean;
}

/**
 * Buscar contrato completo por ID (uso interno)
 */
async function fetchContract(contractId: string): Promise<any> {
    const response = await ixcClient.post('/cliente_contrato', {
        qtype: 'cliente_contrato.id',
        query: contractId,
        oper: '=',
        page: '1',
        rp: '1'
    });

    const contract = response.data?.registros?.[0];
    if (!contract) {
        throw new Error(`Contrato ${contractId} não encontrado`);
    }
    return contract;
}

/**
 * Buscar contratos do cliente com dados de endereço completos
 * Prioriza endereço do contrato, usa dados do cliente como fallback
 */
export async function getContracts(clientId: string) {
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

        if (contracts.length > 0) {
            const c = contracts[0];
            debugLog('CONTRACT', `Contrato ${c.id} - Cartão: ${c.credit_card_recorrente_numero_cartao?.substring(0, 4)}... | Carteira: ${c.id_carteira_cobranca}`);
        }

        // Buscar dados do cliente como fallback para endereço
        const clientResponse = await ixcClient.post('/cliente', {
            qtype: 'cliente.id',
            query: clientId,
            oper: '=',
        });
        const clientData = clientResponse.data?.registros?.[0];

        // Processar cada contrato com busca de cidade/estado
        const processedContracts = await Promise.all(contracts.map(async (contract: any) => {
            const endereco = contract.endereco || clientData?.endereco || '';
            const numero = contract.numero || clientData?.numero || '';
            const bairro = contract.bairro || clientData?.bairro || '';

            const cidadeId = (contract.cidade && contract.cidade !== '0' && contract.cidade !== '')
                ? contract.cidade
                : clientData?.cidade;
            const estadoId = (contract.estado && contract.estado !== '0' && contract.estado !== '')
                ? contract.estado
                : clientData?.estado;

            let cidadeNome = '';
            let estadoNome = '';

            if (cidadeId) {
                cidadeNome = await getCityName(cidadeId);
            }
            if (estadoId) {
                estadoNome = await getStateName(estadoId);
            }

            return {
                ...contract,
                descricao_aux_plano_venda: contract.descricao_aux_plano_venda || '',
                endereco,
                numero,
                bairro,
                cidade: cidadeNome,
                cidadeId: cidadeId,
                estado: estadoNome,
            };
        }));

        return processedContracts;
    } catch (error) {
        console.error('IXC getContracts error:', error);
        throw error;
    }
}

/**
 * Obter PDF do contrato em base64
 */
export async function getContractPdf(contractId: string): Promise<string | null> {
    try {
        debugLog('CONTRACT', `Fetching PDF for contract: ${contractId}`);

        const response = await ixcClient.post('/cliente_contrato_imprimir_contrato_17678', {
            id: contractId
        });

        debugLog('CONTRACT', 'Response type:', typeof response.data);

        if (response.data) {
            if (typeof response.data === 'string' && response.data.startsWith('JVBER')) {
                return response.data;
            }
            return response.data.base64 || response.data.arquivo || response.data.pdf || response.data.contrato || null;
        }
        return null;
    } catch (error) {
        console.error('IXC getContractPdf error:', error);
        throw error;
    }
}

/**
 * Atualizar contrato com dados de cartão recorrente
 * - Tokeniza via Cielo (feito na rota, não aqui)
 * - Altera carteira de cobrança para 3 (recorrente)
 */
export async function updateContractRecurringCard(contractId: string, cardData: {
    cardNumber: string;
    holder: string;
    expirationDate: string;
    securityCode: string;
    brand: string;
    token: string;
}) {
    try {
        debugLog('CONTRACT', `Atualizando cartão recorrente para contrato ${contractId}`);

        const currentContract = await fetchContract(contractId);

        const payload = sanitizePayload({
            ...currentContract,
            id_carteira_cobranca: '3',
            credit_card_recorrente_bandeira_cartao: cardData.brand.charAt(0).toUpperCase() + cardData.brand.slice(1),
            credit_card_recorrente_numero_cartao: cardData.cardNumber,
            credit_card_recorrente_nome_cartao: cardData.holder,
            credit_card_recorrente_validade_cartao: cardData.expirationDate,
            credit_card_recorrente_token: cardData.token,
        });

        debugLog('CONTRACT', 'Payload Update:', JSON.stringify(payload, null, 2));

        const response = await ixcUpdateClient.put(`/cliente_contrato/${contractId}`, payload);

        debugLog('CONTRACT', 'Resposta IXC:', JSON.stringify(response.data));

        if (response.data.type !== 'success') {
            console.error('[CONTRACT] Erro IXC:', response.data);
            throw new Error(JSON.stringify({ ...response.data, payload_sent: payload }));
        }

        return response.data;
    } catch (error: any) {
        console.error('IXC updateContractRecurringCard error:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Remover cartão recorrente do contrato
 * Limpa campos do cartão e volta carteira para boleto (13)
 */
export async function deleteRecurringCard(contractId: string) {
    try {
        debugLog('CONTRACT', `Removendo cartão recorrente do contrato ${contractId}`);

        const currentContract = await fetchContract(contractId);

        const payload = sanitizePayload({
            ...currentContract,
            id_carteira_cobranca: '13',
            credit_card_recorrente_bandeira_cartao: '',
            credit_card_recorrente_numero_cartao: '',
            credit_card_recorrente_nome_cartao: '',
            credit_card_recorrente_validade_cartao: '',
            credit_card_recorrente_cvv_cartao: '',
            credit_card_recorrente_token: '',
        });

        const response = await ixcUpdateClient.put(`/cliente_contrato/${contractId}`, payload);

        if (response.data.type !== 'success') {
            console.error('[CONTRACT] Erro IXC ao excluir cartão:', response.data);
            throw new Error(JSON.stringify({ ...response.data, payload_sent: payload }));
        }

        return response.data;
    } catch (error: any) {
        console.error('IXC deleteRecurringCard error:', error.response?.data || error.message);
        throw error;
    }
}
