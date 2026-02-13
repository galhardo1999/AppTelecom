/**
 * Serviço IXC — Operações de Cliente
 */

import CryptoJS from 'crypto-js';
import { ixcClient } from './http-client.js';

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
 * Buscar cliente pelo email do hotsite
 */
export async function findClientByEmail(email: string): Promise<IXCClient | null> {
    try {
        const response = await ixcClient.post('/cliente', {
            qtype: 'cliente.hotsite_email',
            query: email,
            oper: '=',
            page: '1',
            rp: '1',
            sortname: 'cliente.id',
            sortorder: 'desc'
        });

        if (response.data?.registros?.length > 0) {
            return response.data.registros[0];
        }
        return null;
    } catch (error) {
        console.error('IXC findClientByEmail error:', error);
        throw error;
    }
}

/**
 * Validar senha usando MD5 (padrão IXC) com fallback para texto plano
 * Alguns clientes no IXC possuem a senha armazenada em texto plano ao invés de MD5
 */
export function validatePassword(inputPassword: string, storedPassword: string): boolean {
    // Comparação por hash MD5 (padrão IXC)
    const inputHash = CryptoJS.MD5(inputPassword).toString();
    if (inputHash === storedPassword) {
        return true;
    }
    // Fallback: comparação direta (senha armazenada em texto plano)
    return inputPassword === storedPassword;
}
