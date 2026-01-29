export interface Invoice {
    id: string;
    id_cliente: string;
    id_contrato?: string; // ID do contrato associado
    descricao: string;
    valor: string; // IXC often returns values as strings, e.g., "100.00"
    data_vencimento: string;
    data_pagamento?: string; // Data de pagamento (para faturas pagas)
    status: string; // 'A' for Aberto, 'P' for Pago, etc.
    status_classificado?: string; // Status classificado pelo backend
    linha_digitavel?: string; // For Boleto
    link_boleto?: string; // URL to PDF
    pix_copia_cola?: string; // PIX copy-paste code
    gateway_link?: string; // Payment gateway link
}

export interface Contract {
    id: string; // Mapear de id_vd_contrato
    id_cliente: string;
    contrato: string; // Número do contrato
    status: string;
    status_internet: string;
    data_cadastro: string; // Mapear de data
    data_ativacao: string;
    data_cancelamento: string;

    // Campos do plano
    id_plano?: string;
    plano_nome?: string; // Mapear de descricao_aux_plano_venda
    descricao_aux_plano_venda?: string;

    // Endereço (vem do cliente)
    endereco: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado?: string;
    complemento?: string;
    cep?: string;

    // Pagamento
    forma_pagamento?: string;
    tipo_cobranca?: string;
    valor?: string;
    valor_contrato?: string;

    // Extras
    renovacao_automatica?: string;
    contrato_pdf?: string;
}

export interface RadUsuario {
    id: string;
    id_cliente: string;
    login: string;
    senha: string;
    ip: string;
    mac: string;
    online: string;
    // Consumption fields from IXC radusuarios
    consumo: string;        // Total download (bytes/KB)
    consumo_upload: string; // Total upload (bytes/KB)
    consumo_diario: string; // Daily consumption
    // Traffic fields (mapped from consumo)
    rx: string;
    tx: string;
    // ONU/OLT signal levels
    onu_rx: string;
    onu_tx: string;
    olt_rx: string;
    olt_tx: string;
    // Connection info
    tempo_online: string;
    ultima_conexao: string;
    id_conexao: string;
    status: string;
}
