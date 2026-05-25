/**
 * Serviço IXC — Operações de Cliente
 */

import CryptoJS from 'crypto-js';
import { ixcClient } from './http-client.js';
import { descreverErroSeguro } from '../../utils/sanitizar.js';

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
 * Buscar clientes pelo email do hotsite.
 * O IXC pode permitir e-mails duplicados; quem autentica precisa resolver a ambiguidade.
 */
export async function findClientsByEmail(email: string): Promise<IXCClient[]> {
    try {
        const response = await ixcClient.post('/cliente', {
            qtype: 'cliente.hotsite_email',
            query: email,
            oper: '=',
            page: '1',
            rp: '20',
            sortname: 'cliente.id',
            sortorder: 'desc'
        });

        return response.data?.registros || [];
    } catch (error) {
        console.error('IXC findClientsByEmail error:', descreverErroSeguro(error));
        throw error;
    }
}

/**
 * Buscar cliente pelo email do hotsite.
 * Mantido para compatibilidade com chamadas antigas; prefira findClientsByEmail no login.
 */
export async function findClientByEmail(email: string): Promise<IXCClient | null> {
    const clientes = await findClientsByEmail(email);
    return clientes[0] || null;
}

/**
 * Buscar cliente pelo ID do IXC.
 */
export async function findClientById(clientId: string): Promise<IXCClient | null> {
    try {
        const response = await ixcClient.post('/cliente', {
            qtype: 'cliente.id',
            query: clientId,
            oper: '=',
            page: '1',
            rp: '1',
        });

        return response.data?.registros?.[0] || null;
    } catch (error) {
        console.error('IXC findClientById error:', descreverErroSeguro(error));
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
