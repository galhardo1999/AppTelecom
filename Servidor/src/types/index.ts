/**
 * Tipos TypeScript centralizados para o projeto
 */

// ==========================================
// TIPOS DO IXC
// ==========================================

/**
 * Cliente do sistema IXC
 */
export interface IXCClient {
    id: string;
    razao: string;
    hotsite_email: string;
    senha?: string;
    endereco?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    telefone?: string;
    celular?: string;
    cpf_cnpj?: string;
    ativo?: 'S' | 'N';
    [key: string]: any;
}

/**
 * Fatura do sistema IXC
 */
export interface IXCInvoice {
    id: string;
    id_cliente: string;
    data_vencimento: string;
    data_pagamento?: string;
    valor: string;
    status: 'A' | 'P' | 'C' | 'R' | 'L' | 'V';
    status_original?: string;
    status_classificado?: 'A' | 'P' | 'V';
    pix_copia_cola?: string;
    [key: string]: any;
}

/**
 * Contrato do sistema IXC
 */
export interface IXCContract {
    id: string;
    id_cliente: string;
    status: string;
    descricao_aux_plano_venda?: string;
    endereco?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    [key: string]: any;
}

/**
 * Uso de internet (radusuarios)
 */
export interface IXCUsage {
    id: string;
    id_cliente: string;
    login: string;
    ip?: string;
    mac?: string;
    online: string;
    status: string;
    consumo: string;
    consumo_upload: string;
    consumo_diario: string;
    rx: string;
    tx: string;
    onu_rx?: string;
    onu_tx?: string;
    olt_rx?: string;
    olt_tx?: string;
    tempo_online?: string;
    ultima_conexao?: string;
    [key: string]: any;
}

// ==========================================
// TIPOS DO JWT
// ==========================================

/**
 * Payload do token JWT
 */
export interface JWTPayload {
    userId: string;
    email: string;
    name: string;
}

// ==========================================
// TIPOS DA API
// ==========================================

/**
 * Resposta de erro padrão
 */
export interface ErrorResponse {
    error: string;
    details?: string;
}

/**
 * Resposta de login
 */
export interface LoginResponse {
    token: string;
    user: Omit<IXCClient, 'senha'> & { cidadeNome?: string };
}

/**
 * Resposta de histórico de faturas
 */
export interface InvoiceHistoryResponse {
    abertas: IXCInvoice[];
    vencidas: IXCInvoice[];
    pagas: IXCInvoice[];
    all: IXCInvoice[];
}

// ==========================================
// TIPOS DO RATE LIMITER
// ==========================================

export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
}

export interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// ==========================================
// TIPOS DE QUERY IXC
// ==========================================

export interface IXCQueryParams {
    table: string;
    field: string;
    value: string;
    limit?: number;
    page?: number;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    gridParams?: any[];
}
