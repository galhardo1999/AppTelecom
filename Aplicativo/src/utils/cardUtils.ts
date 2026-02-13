import { Ionicons } from '@expo/vector-icons';

/**
 * Card brand detection and info utilities
 * Extracted from recorrencia/index.tsx and recorrencia/cadastro.tsx
 */

export interface BrandInfo {
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    label: string;
    gradient: readonly [string, string, ...string[]];
}

/**
 * Returns the icon, color, label, and gradient for a card brand
 */
export function getBrandInfo(brand: string): BrandInfo {
    switch (brand) {
        case 'visa': return { icon: 'card', color: '#1A1F71', label: 'Visa', gradient: ['#1a1f71', '#283593'] };
        case 'mastercard': return { icon: 'card', color: '#EB001B', label: 'Mastercard', gradient: ['#eb001b', '#f79e1b'] };
        case 'elo': return { icon: 'card', color: '#00A4E0', label: 'Elo', gradient: ['#00A4E0', '#00416B'] };
        case 'amex': return { icon: 'card', color: '#006FCF', label: 'Amex', gradient: ['#006FCF', '#002663'] };
        default: return { icon: 'card-outline', color: '#64748b', label: 'Cartão', gradient: ['#334155', '#1e293b'] };
    }
}

/**
 * Detects card brand from card number (first digits)
 */
export function detectCardBrand(number: string): string {
    const clean = number.replace(/\D/g, '');
    if (/^4/.test(clean)) return 'visa';
    if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return 'mastercard';
    if (/^(636368|438935|504175|451416|636297|5067|4576|4011|506699)/.test(clean)) return 'elo';
    if (/^3[47]/.test(clean)) return 'amex';
    if (/^(606282|3841)/.test(clean)) return 'hipercard';
    if (/^3(?:0[0-5]|[68])/.test(clean)) return 'diners';
    return '';
}

/**
 * Masks card number: XXXX XXXX XXXX XXXX
 */
export function maskCardNumber(value: string): string {
    const clean = value.replace(/\D/g, '').slice(0, 16);
    const groups = clean.match(/.{1,4}/g);
    return groups ? groups.join(' ') : clean;
}

/**
 * Masks expiry date: MM/AA
 */
export function maskExpiry(value: string): string {
    const clean = value.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) {
        return `${clean.slice(0, 2)}/${clean.slice(2)}`;
    }
    return clean;
}
