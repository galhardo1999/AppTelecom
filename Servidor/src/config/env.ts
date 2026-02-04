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

// Variáveis obrigatórias
export const IXC_HOST = requireEnv('IXC_HOST');
export const IXC_TOKEN = requireEnv('IXC_TOKEN');
export const JWT_SECRET = requireEnv('JWT_SECRET');

// Variáveis opcionais com valores padrão
export const PORT = parseInt(process.env.PORT || '3001', 10);
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const NODE_ENV = process.env.NODE_ENV || 'development';

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

// Log de configuração (apenas em desenvolvimento)
if (isDevelopment) {
    console.log('📋 Configuração carregada:');
    console.log(`  - IXC_HOST: ${IXC_HOST.substring(0, 30)}...`);
    console.log(`  - JWT_EXPIRES_IN: ${JWT_EXPIRES_IN}`);
    console.log(`  - PORT: ${PORT}`);
    console.log(`  - ALLOWED_ORIGINS: ${ALLOWED_ORIGINS ? ALLOWED_ORIGINS.join(', ') : 'todas (dev mode)'}`);
}
