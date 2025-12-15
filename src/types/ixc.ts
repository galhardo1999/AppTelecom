export interface Invoice {
    id: string;
    id_cliente: string;
    descricao: string;
    valor: string; // IXC often returns values as strings, e.g., "100.00"
    data_vencimento: string;
    status: string; // 'A' for Aberto, 'P' for Pago, etc.
    linha_digitavel?: string; // For Boleto
    link_boleto?: string; // URL to PDF
}
