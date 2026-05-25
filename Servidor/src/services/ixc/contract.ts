/**
 * Serviço IXC — Operações de Contrato
 */

import { ixcClient, ixcUpdateClient, debugLog } from './http-client.js';
import { getCityName, getStateName } from './location.js';
import { mascararCartao, sanitizarDadosSensiveis, descreverErroSeguro } from '../../utils/sanitizar.js';

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

function respostaSucessoIXC(dados: any): boolean {
    return dados?.type === 'success';
}

async function atualizarContratoComFallback(
    contractId: string,
    payloadParcial: Record<string, any>,
    payloadCompleto: Record<string, any>,
    contexto: string
) {
    try {
        debugLog('CONTRACT', `Payload parcial ${contexto}:`, JSON.stringify(sanitizarDadosSensiveis(payloadParcial), null, 2));
        const response = await ixcUpdateClient.put(`/cliente_contrato/${contractId}`, payloadParcial);

        if (respostaSucessoIXC(response.data)) {
            return response.data;
        }

        debugLog('CONTRACT', `IXC recusou payload parcial ${contexto}, tentando payload completo sanitizado`, sanitizarDadosSensiveis(response.data));
    } catch (error: any) {
        const status = error.response?.status;
        if (status && status !== 400 && status !== 422) {
            throw error;
        }

        debugLog('CONTRACT', `Erro de validação no payload parcial ${contexto}, tentando payload completo sanitizado`, sanitizarDadosSensiveis(error.response?.data || error.message));
    }

    debugLog('CONTRACT', `Payload completo ${contexto}:`, JSON.stringify(sanitizarDadosSensiveis(payloadCompleto), null, 2));
    const response = await ixcUpdateClient.put(`/cliente_contrato/${contractId}`, payloadCompleto);

    if (!respostaSucessoIXC(response.data)) {
        console.error(`[CONTRACT] Erro IXC ${contexto}:`, sanitizarDadosSensiveis(response.data));
        throw new Error(`IXC recusou ${contexto}`);
    }

    return response.data;
}

function sanitizarContratoParaCliente(contrato: Record<string, any>): Record<string, any> {
    const limpo = { ...contrato };
    delete limpo.credit_card_recorrente_token;
    delete limpo.credit_card_recorrente_cvv_cartao;
    delete limpo.credit_card_recorrente_security_code;

    if (typeof limpo.credit_card_recorrente_numero_cartao === 'string') {
        limpo.credit_card_recorrente_numero_cartao = mascararCartao(limpo.credit_card_recorrente_numero_cartao);
    }

    return limpo;
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
 * Buscar contrato por ID para validação de propriedade.
 */
export async function getContractById(contractId: string): Promise<any | null> {
    try {
        return await fetchContract(contractId);
    } catch (error) {
        if (error instanceof Error && error.message.includes('não encontrado')) {
            return null;
        }
        throw error;
    }
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
            debugLog('CONTRACT', `Contrato ${c.id} - Cartão: ${mascararCartao(c.credit_card_recorrente_numero_cartao || '')} | Carteira: ${c.id_carteira_cobranca}`);
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

            return sanitizarContratoParaCliente({
                ...contract,
                descricao_aux_plano_venda: contract.descricao_aux_plano_venda || '',
                endereco,
                numero,
                bairro,
                cidade: cidadeNome,
                cidadeId: cidadeId,
                estado: estadoNome,
            });
        }));

        return processedContracts;
    } catch (error) {
        console.error('IXC getContracts error:', descreverErroSeguro(error));
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
        console.error('IXC getContractPdf error:', descreverErroSeguro(error));
        throw error;
    }
}

/**
 * Atualizar contrato com dados de cartão recorrente
 * - Tokeniza via Cielo (feito na rota, não aqui)
 * - Altera carteira de cobrança para 3 (recorrente)
 */
export async function updateContractRecurringCard(contractId: string, cardData: {
    ultimosDigitos: string;
    holder: string;
    expirationDate: string;
    brand: string;
    token: string;
}) {
    try {
        debugLog('CONTRACT', `Atualizando cartão recorrente para contrato ${contractId}`);

        const currentContract = await fetchContract(contractId);

        const payloadParcial = {
            id_carteira_cobranca: '3',
            credit_card_recorrente_bandeira_cartao: cardData.brand.charAt(0).toUpperCase() + cardData.brand.slice(1),
            credit_card_recorrente_numero_cartao: `************${cardData.ultimosDigitos}`,
            credit_card_recorrente_nome_cartao: cardData.holder,
            credit_card_recorrente_validade_cartao: cardData.expirationDate,
            credit_card_recorrente_token: cardData.token,
        };

        const payloadCompleto = sanitizePayload({
            ...currentContract,
            ...payloadParcial,
        });

        const response = await atualizarContratoComFallback(contractId, payloadParcial, payloadCompleto, 'atualização de cartão recorrente');

        return response;
    } catch (error: any) {
        console.error('IXC updateContractRecurringCard error:', descreverErroSeguro(error.response?.data || error.message));
        throw error;
    }
}

/**
 * Aceitar contrato digitalmente
 * - Altera status para 'A' (Ativo)
 * - Adiciona observação com dados do aceite
 */
export async function acceptContract(contractId: string, acceptanceData: {
    ip: string;
    userAgent: string;
    timestamp: string;
}) {
    try {
        debugLog('CONTRACT', `Processando aceite do contrato ${contractId}`);

        const currentContract = await fetchContract(contractId);

        // Se já estiver ativo, não faz nada
        if (currentContract.status === 'A') {
            return {
                success: true,
                message: 'Contrato já está ativo',
                contractId
            };
        }

        const obsAceite = `Contrato aceito digitalmente via App Apollo Telecom.\nData: ${acceptanceData.timestamp}\nIP: ${acceptanceData.ip}\nDispositivo: ${acceptanceData.userAgent}`;

        const payloadParcial = {
            data_ativacao: acceptanceData.timestamp.split('T')[0].split('-').reverse().join('/'), // DD/MM/YYYY
            obs: (currentContract.obs ? currentContract.obs + '\n\n' : '') + obsAceite,
            status: 'A',
        };

        const payloadCompleto = sanitizePayload({
            ...currentContract,
            ...payloadParcial,
        });
        payloadCompleto.status = payloadParcial.status;

        const response = await atualizarContratoComFallback(contractId, payloadParcial, payloadCompleto, 'aceite do contrato');
        debugLog('CONTRACT', 'Contrato ativado com sucesso');

        return {
            success: true,
            message: 'Contrato aceito com sucesso',
            contractId,
            data: response
        };
    } catch (error: any) {
        console.error('IXC acceptContract error:', descreverErroSeguro(error.response?.data || error.message));
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

        const payloadParcial = {
            id_carteira_cobranca: '13',
            credit_card_recorrente_bandeira_cartao: '',
            credit_card_recorrente_numero_cartao: '',
            credit_card_recorrente_nome_cartao: '',
            credit_card_recorrente_validade_cartao: '',
            credit_card_recorrente_cvv_cartao: '',
            credit_card_recorrente_token: '',
        };

        const payloadCompleto = sanitizePayload({
            ...currentContract,
            ...payloadParcial,
        });

        return await atualizarContratoComFallback(contractId, payloadParcial, payloadCompleto, 'remoção de cartão recorrente');
    } catch (error: any) {
        console.error('IXC deleteRecurringCard error:', descreverErroSeguro(error.response?.data || error.message));
        throw error;
    }
}
