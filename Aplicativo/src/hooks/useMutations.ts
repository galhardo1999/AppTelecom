import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { bffApi } from '../services/api';
import { logger } from '../utils/logger';

/**
 * Mutation hook to generate PIX code for an invoice
 */
export function usePixCode() {
    return useMutation({
        mutationFn: (invoiceId: string) => bffApi.getPixCode(invoiceId),
        onError: (error) => {
            logger.error('Error generating PIX code:', error);
        },
    });
}

/**
 * Mutation hook to generate boleto PDF for an invoice
 */
export function useBoleto() {
    return useMutation({
        mutationFn: (invoiceId: string) => bffApi.getBoleto(invoiceId),
        onError: (error) => {
            logger.error('Error generating boleto:', error);
        },
    });
}

/**
 * Mutation hook to download contract PDF
 */
export function useContractPdf() {
    return useMutation({
        mutationFn: (contractId: string) => bffApi.getContractPdf(contractId),
        onError: (error) => {
            logger.error('Error downloading contract PDF:', error);
        },
    });
}

/**
 * Mutation hook to setup a recurring card on a contract
 */
export function useSetupRecurringCard() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ contractId, cardData }: {
            contractId: string;
            cardData: {
                cardNumber: string;
                holder: string;
                expirationDate: string;
                securityCode: string;
                brand: string;
                customerName?: string;
            };
        }) => bffApi.setupRecurringCard(contractId, cardData),
        onSuccess: () => {
            // Invalidar cache de contratos para refletir a nova carteira
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
        },
        onError: (error: any) => {
            logger.error('Error setting up recurring card:', error);
            const errorMessage = error.response?.data?.error || 'Não foi possível cadastrar o cartão. Tente novamente.';
            Alert.alert('Erro', errorMessage);
        },
    });
}

/**
 * Mutation hook to delete a recurring card from a contract
 */
export function useDeleteRecurringCard() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (contractId: string) => bffApi.deleteRecurringCard(contractId),
        onSuccess: () => {
            // Invalidar cache de contratos para refletir a remoção do cartão
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
        },
        onError: (error) => {
            logger.error('Error deleting recurring card:', error);
            Alert.alert('Erro', 'Não foi possível remover o cartão. Tente novamente.');
        },
    });
}
