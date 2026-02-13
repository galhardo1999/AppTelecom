/**
 * Production-safe logger utility
 * 
 * - In __DEV__: logs to console normally
 * - In production: suppresses info/debug, keeps only warnings and errors
 * - Automatically sanitizes sensitive fields from logged objects
 */

const SENSITIVE_KEYS = [
    'password', 'senha', 'token', 'access_token', 'refresh_token',
    'cardNumber', 'securityCode', 'cvc', 'cvv',
    'credit_card', 'numero_cartao', 'validade_cartao',
    'Authorization', 'authorization',
];

/**
 * Recursively sanitize an object by redacting sensitive fields
 */
function sanitize(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitize);

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        if (SENSITIVE_KEYS.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
            sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitize(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

function formatArgs(args: unknown[]): unknown[] {
    return args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
            return sanitize(arg);
        }
        return arg;
    });
}

export const logger = {
    /** Info-level log — suppressed in production */
    info: (...args: unknown[]): void => {
        if (__DEV__) {
            console.log(...formatArgs(args));
        }
    },

    /** Debug-level log — suppressed in production */
    debug: (...args: unknown[]): void => {
        if (__DEV__) {
            console.debug(...formatArgs(args));
        }
    },

    /** Warning — always shown, but sanitized */
    warn: (...args: unknown[]): void => {
        console.warn(...formatArgs(args));
    },

    /** Error — always shown, but sanitized */
    error: (...args: unknown[]): void => {
        console.error(...formatArgs(args));
    },
};
