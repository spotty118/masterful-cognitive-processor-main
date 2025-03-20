/**
 * Cache Service Implementation
 * Provides file-based caching with statistics tracking
 */
import { ICacheService } from '../interfaces/ICacheService.js';
import { CacheResult } from '../models/types.js';
/**
 * Checks if a result is cached (multi-level: memory → disk)
 */
export declare const checkCache: (cacheType: string, cacheKey: string) => Promise<CacheResult | null>;
/**
 * Stores a result in the cache (multi-level: memory + disk)
 */
export declare const storeCache: (cacheType: string, cacheKey: string, response: string) => Promise<void>;
/**
 * Gets statistics about the cache system
 */
export declare const getCacheStats: (cacheType?: string) => Promise<{
    totalItems: number;
    hitRate: number;
    avgResponseTime: number;
    sizeInBytes: number;
    memoryItems: number;
    total: number;
    byType?: Record<string, {
        items: number;
        hitRate: number;
    }>;
}>;
/**
 * Performs maintenance on the cache system
 */
export declare const performCacheMaintenance: () => Promise<number>;
declare const _default: ICacheService;
export default _default;
