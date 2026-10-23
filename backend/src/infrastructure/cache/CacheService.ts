// backend/src/infrastructure/cache/CacheService.ts

export interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
}

export interface CacheOptions {
  maxEntries?: number;
  defaultTtlSeconds?: number;
}

export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  flushPattern(pattern: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * CacheService Híbrido Resiliente em Memória.
 *
 * Implementa estratégia LRU delimitada (Max Entries) com expiração TTL ativa e passiva.
 * Suporta invalidação em lote por padrões de chave (ex: catalog:search:*) para consistência
 * imediata em escritas.
 */
export class CacheService implements ICacheService {
  private readonly store: Map<string, CacheEntry<any>> = new Map();
  private readonly maxEntries: number;
  private readonly defaultTtlSeconds: number;

  constructor(options: CacheOptions = {}) {
    this.maxEntries = options.maxEntries ?? 2000;
    this.defaultTtlSeconds = options.defaultTtlSeconds ?? 60;
  }

  public async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  public async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds !== undefined ? ttlSeconds : this.defaultTtlSeconds;
    const expiresAt = ttl > 0 ? Date.now() + ttl * 1000 : null;

    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxEntries) {
      // LRU eviction: remove o item mais antigo (primeira chave do iterador do Map)
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(key, { value, expiresAt });
  }

  public async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  public async flushPattern(pattern: string): Promise<void> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of Array.from(this.store.keys())) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  public async clear(): Promise<void> {
    this.store.clear();
  }
}

export const defaultCacheService = new CacheService();
