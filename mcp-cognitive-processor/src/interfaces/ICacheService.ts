/**
 * Interface for cache operations
 * Defines methods for storing and retrieving cached data
 */

import { CacheResult } from '../models/types.js';

export interface ICacheService {
  /**
   * Checks if a result is cached
   * @param cacheType - The type of cache to check
   * @param cacheKey - The key to look up in the cache
   * @returns The cached result or null if not found
   */
  checkCache(cacheType: string, cacheKey: string): Promise<CacheResult | null>;

  /**
   * Stores a result in the cache
   * @param cacheType - The type of cache to store in
   * @param cacheKey - The key to store under
   * @param response - The response to cache
   */
  storeCache(cacheType: string, cacheKey: string, response: string): Promise<void>;

  /**
   * Gets statistics about the cache system
   * @param cacheType - Optional type of cache to get stats for
   * @returns Cache statistics
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

  /**
   * Performs maintenance on the cache system
   * @returns Number of items cleaned up
   */
  performCacheMaintenance(): Promise<number>;
}