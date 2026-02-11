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
// URL da API de Consulta Cielo (Produção)
const CIELO_QUERY_API_URL = 'https://apiquery.cieloecommerce.cielo.com.br';

const cieloClient = axios.create({
    baseURL: CIELO_API_URL,
    headers: {
        'Content-Type': 'application/json',
        'MerchantId': CIELO_MERCHANT_ID,
        'MerchantKey': CIELO_MERCHANT_KEY,
    },
});

const cieloQueryClient = axios.create({
    baseURL: CIELO_QUERY_API_URL,
    headers: {
        'Content-Type': 'application/json',
        'MerchantId': CIELO_MERCHANT_ID,
        'MerchantKey': CIELO_MERCHANT_KEY,
    },
});

/**
 * Logger específico para integração IXC + Cielo
 */
const logIXCIntegration = (step: string, data: any) => {
    console.log(`[IXC-CIELO] ${step}:`, JSON.stringify(data, null, 2));
};

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

const SUPPORTED_BRANDS = ['visa', 'mastercard', 'elo', 'amex', 'hipercard', 'diners'];

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
     * Verifica se a bandeira é suportada
     */
    validateBrand: (brand: string): boolean => {
        const normalizedBrand = brand.toLowerCase();

        if (!SUPPORTED_BRANDS.includes(normalizedBrand)) {
            console.warn('[CIELO] Bandeira não suportada:', brand);
            return false;
        }

        return true;
    },

    /**
     * NOVO: Validar se o token está ativo na Cielo
     */
    validateToken: async (cardToken: string): Promise<boolean> => {
        try {
            console.log('[CIELO] Validando token:', cardToken);

            // A Cielo não tem endpoint direto de validação
            // Mas podemos tentar buscar os dados do token
            const response = await cieloQueryClient.get(`/1/card/${cardToken}`);

            if (response.status === 200) {
                console.log('[CIELO] Token válido');
                return true;
            }

            return false;
        } catch (error: any) {
            console.error('[CIELO] Token inválido ou expirado');
            return false;
        }
    },

    /**
     * Formata resposta para o padrão esperado pelo IXC
     */
    formatTokenForIXC: (cardToken: string, cardData: CardData) => {
        return {
            token: cardToken,
            bandeira: mapBrandToCielo(cardData.brand),
            ultimos_digitos: cardData.cardNumber.slice(-4),
            validade: cardData.expirationDate,
            titular: cardData.holder,
        };
    },

    /**
     * Tokeniza um cartão de crédito via API Cielo 3.0
     * Retorna o CardToken que será salvo no IXC
     */
    tokenizeCard: async (cardData: CardData): Promise<string> => {
        if (!cieloService.validateBrand(cardData.brand)) {
            throw new Error(`Bandeira ${cardData.brand} não é suportada`);
        }

        logIXCIntegration('Início tokenização', {
            bandeira: cardData.brand,
            ultimos_digitos: cardData.cardNumber.slice(-4),
        });

        try {
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

            const response = await cieloClient.post('/1/card/', payload);

            logIXCIntegration('Token gerado', {
                token: response.data.CardToken,
                success: true,
            });

            return response.data.CardToken;

        } catch (error: any) {
            logIXCIntegration('Erro tokenização', {
                error: error.response?.data || error.message,
            });

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

    /**
     * NOVO: Tentar tokenização com retry automático
     */
    tokenizeCardWithRetry: async (
        cardData: CardData,
        maxRetries: number = 3
    ): Promise<string> => {
        let lastError: any;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`[CIELO] Tentativa ${attempt}/${maxRetries}`);

                const token = await cieloService.tokenizeCard(cardData);
                return token;

            } catch (error: any) {
                lastError = error;

                // Não fazer retry em erros de validação (400) ou auth (401)
                if (error.response?.status === 400 || error.response?.status === 401 || error.message?.includes('Erro Cielo')) {
                    throw error;
                }

                // Aguardar antes de tentar novamente
                if (attempt < maxRetries) {
                    const delay = attempt * 1000; // 1s, 2s, 3s...
                    console.log(`[CIELO] Aguardando ${delay}ms antes de retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    },
};
