export interface Invoice {
    id: string;
    id_cliente: string;
    descricao: string;
    valor: string; // IXC often returns values as strings, e.g., "100.00"
    data_vencimento: string;
    status: string; // 'A' for Aberto, 'P' for Pago, etc.
    linha_digitavel?: string; // For Boleto
    link_boleto?: string; // URL to PDF
    pix_copia_cola?: string; // PIX copy-paste code
    gateway_link?: string; // Payment gateway link
}

export interface Contract {
    id: string;
    id_cliente: string;
    contrato: string;
    status: string;
    status_internet: string;
    data_cadastro: string;
    data_ativacao: string;
    data_cancelamento: string;
    download: string;
    upload: string;
    valor: string;
    forma_pagamento: string;
    id_plano: string;
    plano?: string;
    endereco?: string;
    plano_nome?: string;
    valor_contrato?: string;
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
