/**
 * Cache Service Adapter
 * Adapts the cache service implementation to the ICacheService interface
 * @complexity O(1) for initialization
 */
import { ICacheService } from '../interfaces/ICacheService.js';
import { CacheResult } from '../models/types.js';
/**
 * Adapter for the Cache Service
 * Implements the ICacheService interface and delegates to the actual implementation
 */
export declare class CacheServiceAdapter implements ICacheService {
    private cacheDir;
    private memoryCache;
    private maxMemorySize;
    private currentMemorySize;
    private maxEntries;
    private stats;
    constructor(cacheDir?: string, maxMemoryMB?: number, maxEntries?: number);
    private generateKey;
    private getFilePath;
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    private addToMemoryCache;
    private evictLRU;
    private initializeFromDisk;
    private performMaintenance;
    clear(): Promise<void>;
    getStats(): {
        memorySize: number;
        entries: number;
        hitRate: number;
        hits: number;
        misses: number;
        evictions: number;
        totalSaved: number;
    };
    /**
     * Checks if a result is cached
     * @param cacheType - The type of cache to check
     * @param cacheKey - The key to look up in the cache
     * @returns The cached result or null if not found
     * @complexity O(1) for direct lookup
     */
    checkCache(cacheType: string, cacheKey: string): Promise<CacheResult | null>;
    /**
     * Stores a result in the cache
     * @param cacheType - The type of cache to store in
     * @param cacheKey - The key to store under
     * @param response - The response to cache
     * @returns Promise that resolves when the cache is updated
     * @complexity O(1) for storage operation
     */
    storeCache(cacheType: string, cacheKey: string, response: string): Promise<void>;
    /**
     * Invalidates a cache entry
     * @param cacheType - The type of cache to invalidate
     * @param cacheKey - The key to invalidate
     * @returns Promise that resolves when the cache entry is invalidated
     * @complexity O(1) for direct removal
     */
    /**
     * Performs maintenance on the cache system
     * @returns Number of items processed
     * @complexity O(n) where n is the number of cache entries
     */
    performCacheMaintenance(): Promise<number>;
    /**
     * Gets cache statistics
     * @param cacheType - The type of cache to get statistics for (optional)
     * @returns Cache statistics including totalItems, hitRate, avgResponseTime, sizeInBytes, and byType
     * @complexity O(n) where n is the number of cache entries
     */
    getCacheStats(cacheType?: string): Promise<{
        totalItems: number;
        hitRate: number;
        avgResponseTime: number;
        sizeInBytes: number;
        byType?: Record<string, {
            items: number;
            hitRate: number;
        }>;
    }>;
}
