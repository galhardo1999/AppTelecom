/**
 * Serviço de Cache
 * Interface abstrata que pode usar memória local ou Redis
 */

import { UPSTASH_REDIS_URL, UPSTASH_REDIS_TOKEN, isDevelopment } from '../config/env.js';

// Interface do cache
interface CacheStore {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}

// ==========================================
// CACHE EM MEMÓRIA (desenvolvimento)
// ==========================================

interface MemoryCacheEntry {
    value: any;
    expiresAt: number;
}

class MemoryCache implements CacheStore {
    private store = new Map<string, MemoryCacheEntry>();

    async get<T>(key: string): Promise<T | null> {
        const entry = this.store.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }

        return entry.value as T;
    }

    async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
        this.store.set(key, {
            value,
            expiresAt: Date.now() + (ttlSeconds * 1000)
        });
    }

    async delete(key: string): Promise<void> {
        this.store.delete(key);
    }

    async clear(): Promise<void> {
        this.store.clear();
    }
}

// ==========================================
// CACHE COM UPSTASH REDIS (produção)
// ==========================================

class UpstashRedisCache implements CacheStore {
    private baseUrl: string;
    private token: string;

    constructor(url: string, token: string) {
        this.baseUrl = url;
        this.token = token;
    }

    private async request(command: string[]): Promise<any> {
        const response = await fetch(`${this.baseUrl}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(command)
        });

        if (!response.ok) {
            throw new Error(`Redis error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.result;
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const result = await this.request(['GET', key]);
            if (!result) return null;
            return JSON.parse(result) as T;
        } catch {
            return null;
        }
    }

    async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
        await this.request(['SET', key, JSON.stringify(value), 'EX', ttlSeconds.toString()]);
    }

    async delete(key: string): Promise<void> {
        await this.request(['DEL', key]);
    }

    async clear(): Promise<void> {
        // Não implementar FLUSHALL em produção - muito perigoso
        console.warn('Cache clear não suportado em produção');
    }
}

// ==========================================
// INSTÂNCIA DO CACHE
// ==========================================

function createCacheStore(): CacheStore {
    if (UPSTASH_REDIS_URL && UPSTASH_REDIS_TOKEN) {
        console.log('✅ Usando Upstash Redis para cache');
        return new UpstashRedisCache(UPSTASH_REDIS_URL, UPSTASH_REDIS_TOKEN);
    }

    if (isDevelopment) {
        console.log('⚠️ Usando cache em memória (desenvolvimento)');
    } else {
        console.warn('⚠️ ATENÇÃO: Cache em memória não escala horizontalmente');
    }

    return new MemoryCache();
}

export const cacheStore = createCacheStore();

// ==========================================
// HELPER DE CACHE
// ==========================================

/**
 * Busca um valor do cache ou executa o fetcher se não existir
 */
export async function cached<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds = 300
): Promise<T> {
    // Tentar buscar do cache
    const cachedValue = await cacheStore.get<T>(key);
    if (cachedValue !== null) {
        return cachedValue;
    }

    // Buscar dados frescos
    const freshValue = await fetcher();

    // Salvar no cache
    await cacheStore.set(key, freshValue, ttlSeconds);

    return freshValue;
}
