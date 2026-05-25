/**
 * Serviço IXC — Barrel Export
 * Re-exporta todos os módulos como um único objeto `ixcService`
 * para manter compatibilidade com os imports existentes.
 */

import { findClientByEmail, findClientById, findClientsByEmail, validatePassword } from './client.js';
import type { IXCClient } from './client.js';
import { getOpenInvoices, getAllInvoices, getPaidInvoices, getInvoiceById, getPixCode, getBoleto } from './invoice.js';
import { getContracts, getContractById, getContractPdf, updateContractRecurringCard, deleteRecurringCard, acceptContract } from './contract.js';
import { getInternetUsage } from './usage.js';
import { getCityName, getStateName } from './location.js';

export const ixcService = {
    // Client
    findClientByEmail,
    findClientById,
    findClientsByEmail,
    validatePassword,

    // Invoices
    getOpenInvoices,
    getAllInvoices,
    getPaidInvoices,
    getInvoiceById,
    getPixCode,
    getBoleto,

    // Contracts
    getContracts,
    getContractById,
    getContractPdf,
    updateContractRecurringCard,
    deleteRecurringCard,
    acceptContract,

    // Usage
    getInternetUsage,

    // Location
    getCityName,
    getStateName,
};

export type { IXCClient };
