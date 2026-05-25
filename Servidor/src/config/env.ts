/**
 * Configuração de Variáveis de Ambiente
 * Centraliza e valida todas as variáveis de ambiente necessárias
 */

// Validar variáveis obrigatórias
function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        console.error(`❌ Variável de ambiente obrigatória não definida: ${name}`);
        process.exit(1);
    }
    return value;
}

function parsePositiveIntEnv(name: string, fallback: number): number {
    const value = process.env[name];
    if (!value) {
        return fallback;
    }

    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// Variáveis obrigatórias
export const IXC_HOST = requireEnv('IXC_HOST');
export const IXC_TOKEN = requireEnv('IXC_TOKEN');
export const JWT_SECRET = requireEnv('JWT_SECRET');

// Variáveis opcionais com valores padrão
export const PORT = parseInt(process.env.PORT || '3001', 10);
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IXC_TIMEOUT_MS = parsePositiveIntEnv('IXC_TIMEOUT_MS', 15000);

// Cielo (pagamentos recorrentes)
export const CIELO_MERCHANT_ID = process.env.CIELO_MERCHANT_ID || '';
export const CIELO_MERCHANT_KEY = process.env.CIELO_MERCHANT_KEY || '';
export const CIELO_API_URL = process.env.CIELO_API_URL || 'https://api.cieloecommerce.cielo.com.br';
export const CIELO_QUERY_API_URL = process.env.CIELO_QUERY_API_URL || 'https://apiquery.cieloecommerce.cielo.com.br';

// Redis (opcional)
export const REDIS_URL = process.env.REDIS_URL;
export const UPSTASH_REDIS_URL = process.env.UPSTASH_REDIS_URL;
export const UPSTASH_REDIS_TOKEN = process.env.UPSTASH_REDIS_TOKEN;

// CORS - origens permitidas
const originsEnv = process.env.ALLOWED_ORIGINS || '';
export const ALLOWED_ORIGINS = originsEnv
    ? originsEnv.split(',').map(o => o.trim()).filter(Boolean)
    : null; // null = permitir todas (desenvolvimento)

// Helpers
export const isDevelopment = NODE_ENV === 'development';
export const isProduction = NODE_ENV === 'production';

if (JWT_SECRET.length < 32) {
    const mensagem = 'JWT_SECRET deve ter pelo menos 32 caracteres';
    if (isProduction) {
        console.error(`❌ ${mensagem}`);
        process.exit(1);
    }
    console.warn(`⚠️ ${mensagem}`);
}

if (isProduction && (!ALLOWED_ORIGINS || ALLOWED_ORIGINS.length === 0)) {
    console.error('❌ ALLOWED_ORIGINS deve ser configurado em produção');
    process.exit(1);
}

if (isProduction) {
    try {
        const ixcUrl = new URL(IXC_HOST);
        if (ixcUrl.protocol !== 'https:') {
            console.error('❌ IXC_HOST deve usar HTTPS em produção');
            process.exit(1);
        }
    } catch {
        console.error('❌ IXC_HOST deve ser uma URL válida');
        process.exit(1);
    }

    if (!CIELO_MERCHANT_ID || !CIELO_MERCHANT_KEY) {
        console.error('❌ CIELO_MERCHANT_ID e CIELO_MERCHANT_KEY devem ser configurados em produção');
        process.exit(1);
    }
}

// Log de configuração (apenas em desenvolvimento)
if (isDevelopment) {
    console.log('📋 Configuração carregada:');
    console.log(`  - IXC_HOST: ${IXC_HOST.substring(0, 30)}...`);
    console.log(`  - IXC_TIMEOUT_MS: ${IXC_TIMEOUT_MS}`);
    console.log(`  - JWT_EXPIRES_IN: ${JWT_EXPIRES_IN}`);
    console.log(`  - PORT: ${PORT}`);
    console.log(`  - ALLOWED_ORIGINS: ${ALLOWED_ORIGINS ? ALLOWED_ORIGINS.join(', ') : 'todas (dev mode)'}`);
}
