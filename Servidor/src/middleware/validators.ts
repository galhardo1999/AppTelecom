/**
 * Middleware de Validação com Zod
 * Schemas e helpers para validar input de requisições
 */

import { z } from 'zod';
import { Context } from 'hono';

function validarLuhn(numero: string): boolean {
    let soma = 0;
    let alternar = false;

    for (let indice = numero.length - 1; indice >= 0; indice--) {
        let digito = Number(numero[indice]);

        if (alternar) {
            digito *= 2;
            if (digito > 9) {
                digito -= 9;
            }
        }

        soma += digito;
        alternar = !alternar;
    }

    return soma % 10 === 0;
}

function validarValidadeCartao(valor: string): boolean {
    const [mesTexto, anoTexto] = valor.split('/');
    const mes = Number(mesTexto);
    if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
        return false;
    }

    const ano = Number(anoTexto.length === 2 ? `20${anoTexto}` : anoTexto);
    if (!Number.isInteger(ano)) {
        return false;
    }

    const agora = new Date();
    const fimDoMes = new Date(ano, mes, 0, 23, 59, 59, 999);
    return fimDoMes >= agora;
}

// ==========================================
// SCHEMAS
// ==========================================

/**
 * Schema de login
 */
export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email('Email inválido'),
    password: z.string().min(1, 'Senha é obrigatória').max(128, 'Senha inválida'),
});

/**
 * Schema de cartão recorrente
 */
export const recurringCardSchema = z.object({
    cardNumber: z.string()
        .transform((valor) => valor.replace(/\D/g, ''))
        .refine((valor) => valor.length >= 13 && valor.length <= 19, 'Número do cartão deve ter entre 13 e 19 dígitos')
        .refine(validarLuhn, 'Número do cartão inválido'),
    holder: z.string().trim().min(2, 'Nome do titular é obrigatório').max(80, 'Nome do titular muito longo'),
    expirationDate: z.string()
        .regex(/^\d{2}\/\d{2,4}$/, 'Data de validade deve estar no formato MM/AA ou MM/AAAA')
        .refine(validarValidadeCartao, 'Cartão expirado ou validade inválida'),
    securityCode: z.string()
        .min(3, 'CVV deve ter no mínimo 3 dígitos')
        .max(4, 'CVV deve ter no máximo 4 dígitos')
        .regex(/^\d+$/, 'CVV deve conter apenas dígitos'),
    brand: z.string().trim().toLowerCase().refine(
        (val) => ['visa', 'mastercard', 'elo', 'amex', 'hipercard', 'diners'].includes(val.toLowerCase()),
        { message: 'Bandeira inválida. Aceitas: visa, mastercard, elo, amex, hipercard, diners' }
    ),
    customerName: z.string().trim().max(80, 'Nome do cliente muito longo').optional(),
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
