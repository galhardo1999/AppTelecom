/**
 * Middleware de Validação com Zod
 * Schemas e helpers para validar input de requisições
 */

import { z } from 'zod';
import { Context } from 'hono';

// ==========================================
// SCHEMAS
// ==========================================

/**
 * Schema de login
 */
export const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Senha é obrigatória'),
});

/**
 * Schema de cartão recorrente
 */
export const recurringCardSchema = z.object({
    cardNumber: z.string()
        .min(13, 'Número do cartão deve ter no mínimo 13 dígitos')
        .max(19, 'Número do cartão deve ter no máximo 19 dígitos')
        .regex(/^[\d\s-]+$/, 'Número do cartão deve conter apenas dígitos'),
    holder: z.string().min(2, 'Nome do titular é obrigatório'),
    expirationDate: z.string()
        .regex(/^\d{2}\/\d{2,4}$/, 'Data de validade deve estar no formato MM/AA ou MM/AAAA'),
    securityCode: z.string()
        .min(3, 'CVV deve ter no mínimo 3 dígitos')
        .max(4, 'CVV deve ter no máximo 4 dígitos')
        .regex(/^\d+$/, 'CVV deve conter apenas dígitos'),
    brand: z.string().refine(
        (val) => ['visa', 'mastercard', 'elo', 'amex', 'hipercard', 'diners'].includes(val.toLowerCase()),
        { message: 'Bandeira inválida. Aceitas: visa, mastercard, elo, amex, hipercard, diners' }
    ),
    customerName: z.string().optional(),
});

// ==========================================
// HELPER
// ==========================================

/**
 * Valida o body da requisição contra um schema Zod
 * Retorna os dados validados ou uma resposta de erro 400
 */
export async function validateBody<T extends z.ZodType>(
    c: Context,
    schema: T
): Promise<{ success: true; data: z.infer<T> } | { success: false; response: Response }> {
    try {
        const body = await c.req.json();
        const result = schema.safeParse(body);

        if (!result.success) {
            const errors = result.error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            }));

            return {
                success: false,
                response: c.json({
                    error: 'Dados inválidos',
                    details: errors,
                }, 400) as unknown as Response,
            };
        }

        return { success: true, data: result.data };
    } catch (error) {
        return {
            success: false,
            response: c.json({ error: 'Body da requisição inválido' }, 400) as unknown as Response,
        };
    }
}
