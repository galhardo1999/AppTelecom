/**
 * Serviço de integração com a Cielo 3.0
 * Responsável pela tokenização de cartões de crédito
 */

import axios from 'axios';

// Configuração do ambiente Cielo
const CIELO_MERCHANT_ID = process.env.CIELO_MERCHANT_ID || '';
const CIELO_MERCHANT_KEY = process.env.CIELO_MERCHANT_KEY || '';

// URL da API Cielo (Produção)
const CIELO_API_URL = 'https://api.cieloecommerce.cielo.com.br';
// URL Sandbox: 'https://apisandbox.cieloecommerce.cielo.com.br'

const cieloClient = axios.create({
    baseURL: CIELO_API_URL,
    headers: {
        'Content-Type': 'application/json',
        'MerchantId': CIELO_MERCHANT_ID,
        'MerchantKey': CIELO_MERCHANT_KEY,
    },
});

/**
 * Mapeia bandeira para o nome aceito pela Cielo
 */
function mapBrandToCielo(brand: string): string {
    const brandMap: Record<string, string> = {
        'visa': 'Visa',
        'mastercard': 'Master',
        'elo': 'Elo',
        'amex': 'Amex',
        'hipercard': 'Hipercard',
        'diners': 'Diners',
    };
    return brandMap[brand.toLowerCase()] || brand;
}

export interface CardData {
    customerName: string;
    cardNumber: string;
    holder: string;
    expirationDate: string; // MM/YYYY
    brand: string;
    securityCode: string;
}

export interface CieloTokenResponse {
    CardToken: string;
}

export const cieloService = {
    /**
     * Tokeniza um cartão de crédito via API Cielo 3.0
     * Retorna o CardToken que será salvo no IXC
     */
    tokenizeCard: async (cardData: CardData): Promise<string> => {
        try {
            console.log('[CIELO] Iniciando tokenização do cartão...');
            console.log('[CIELO] Bandeira:', cardData.brand);
            console.log('[CIELO] Últimos 4 dígitos:', cardData.cardNumber.slice(-4));

            // Formatar data de expiração para MM/YYYY (Cielo exige esse formato)
            let expirationDate = cardData.expirationDate;
            if (expirationDate.length === 5) {
                // Converter MM/AA para MM/YYYY
                const [mm, aa] = expirationDate.split('/');
                expirationDate = `${mm}/20${aa}`;
            }

            const payload = {
                CustomerName: cardData.customerName,
                CardNumber: cardData.cardNumber.replace(/\D/g, ''),
                Holder: cardData.holder,
                ExpirationDate: expirationDate,
                Brand: mapBrandToCielo(cardData.brand),
            };

            console.log('[CIELO] Payload (sem número completo):', {
                ...payload,
                CardNumber: `****${payload.CardNumber.slice(-4)}`,
            });

            const response = await cieloClient.post('/1/card/', payload);

            console.log('[CIELO] Resposta:', JSON.stringify(response.data));

            if (response.data?.CardToken) {
                console.log('[CIELO] Token gerado com sucesso!');
                return response.data.CardToken;
            }

            throw new Error('Cielo não retornou CardToken na resposta');
        } catch (error: any) {
            console.error('[CIELO] Erro na tokenização:', error.response?.data || error.message);

            // Tratar erros específicos da Cielo
            if (error.response?.status === 400) {
                const cieloErrors = error.response.data;
                throw new Error(`Erro Cielo: ${JSON.stringify(cieloErrors)}`);
            }

            if (error.response?.status === 401) {
                throw new Error('Credenciais da Cielo inválidas. Verifique MerchantId e MerchantKey.');
            }

            throw error;
        }
    },
};
