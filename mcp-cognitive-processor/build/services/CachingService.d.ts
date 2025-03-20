import { EventEmitter } from 'events';
type CacheStorageBackend = 'memory' | 'file' | 'redis';
type CacheEvictionPolicy = 'lru' | 'ttl' | 'size';
interface CacheConfig {
    backend: CacheStorageBackend;
    policy: CacheEvictionPolicy;
    maxSize: number;
    maxEntries: number;
    defaultTTL: number;
    persistPath?: string;
}
export declare class CachingService extends EventEmitter {
    private static instance;
    private cache;
    private config;
    private totalSize;
    private constructor();
    static getInstance(config?: Partial<CacheConfig>): CachingService;
    private generateKey;
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    delete(key: string): Promise<boolean>;
    clear(): Promise<void>;
    private shouldEvict;
    private evictEntry;
    private calculateSize;
    private persistCache;
    private loadPersistedCache;
    getStats(): {
        entryCount: number;
        totalSize: number;
        hitRate: number;
        missRate: number;
    };
}
export {};
