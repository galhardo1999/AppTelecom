/**
 * Serviço IXC — Barrel Export
 * Re-exporta todos os módulos como um único objeto `ixcService`
 * para manter compatibilidade com os imports existentes.
 */

import { findClientByEmail, validatePassword } from './client.js';
import type { IXCClient } from './client.js';
import { getOpenInvoices, getAllInvoices, getPaidInvoices, getPixCode, getBoleto } from './invoice.js';
import { getContracts, getContractPdf, updateContractRecurringCard, deleteRecurringCard } from './contract.js';
import { getInternetUsage } from './usage.js';
import { getCityName, getStateName } from './location.js';

export const ixcService = {
    // Client
    findClientByEmail,
    validatePassword,

    // Invoices
    getOpenInvoices,
    getAllInvoices,
    getPaidInvoices,
    getPixCode,
    getBoleto,

    // Contracts
    getContracts,
    getContractPdf,
    updateContractRecurringCard,
    deleteRecurringCard,

    // Usage
    getInternetUsage,

    // Location
    getCityName,
    getStateName,
};

export type { IXCClient };
