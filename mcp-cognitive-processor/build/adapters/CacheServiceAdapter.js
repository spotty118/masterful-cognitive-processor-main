/**
 * Cache Service Adapter
 * Adapts the cache service implementation to the ICacheService interface
 * @complexity O(1) for initialization
 */
import CacheService from '../services/cacheService.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
/**
 * Adapter for the Cache Service
 * Implements the ICacheService interface and delegates to the actual implementation
 */
export class CacheServiceAdapter {
    cacheDir;
    memoryCache;
    maxMemorySize;
    currentMemorySize;
    maxEntries;
    stats;
    constructor(cacheDir = './data/cache', maxMemoryMB = 100, maxEntries = 1000) {
        this.cacheDir = cacheDir;
        this.memoryCache = new Map();
        this.maxMemorySize = maxMemoryMB * 1024 * 1024; // Convert MB to bytes
        this.currentMemorySize = 0;
        this.maxEntries = maxEntries;
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            totalSaved: 0
        };
        // Ensure cache directory exists
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
        // Initialize cache from disk
        this.initializeFromDisk();
        // Start periodic maintenance
        setInterval(() => this.performMaintenance(), 5 * 60 * 1000); // Run every 5 minutes
    }
    generateKey(key) {
        return crypto.createHash('sha256').update(key).digest('hex');
    }
    getFilePath(key) {
        const hash = this.generateKey(key);
        return path.join(this.cacheDir, `${hash}.cache`);
    }
    async get(key) {
        const memoryEntry = this.memoryCache.get(key);
        if (memoryEntry) {
            // Update access stats
            memoryEntry.accessCount++;
            memoryEntry.lastAccessed = Date.now();
            this.stats.hits++;
            return memoryEntry.value;
        }
        // Try to get from disk
        try {
            const filePath = this.getFilePath(key);
            if (fs.existsSync(filePath)) {
                const data = await fs.promises.readFile(filePath, 'utf8');
                const entry = JSON.parse(data);
                // Add to memory cache if space allows
                if (this.currentMemorySize + entry.size <= this.maxMemorySize) {
                    this.addToMemoryCache(key, entry.value);
                }
                this.stats.hits++;
                return entry.value;
            }
        }
        catch (error) {
            console.error('Cache read error:', error);
        }
        this.stats.misses++;
        return null;
    }
    async set(key, value) {
        const size = Buffer.byteLength(value, 'utf8');
        const entry = {
            value,
            timestamp: Date.now(),
            accessCount: 0,
            lastAccessed: Date.now(),
            size
        };
        // Save to disk first
        try {
            const filePath = this.getFilePath(key);
            await fs.promises.writeFile(filePath, JSON.stringify(entry));
        }
        catch (error) {
            console.error('Cache write error:', error);
            return;
        }
        // Try to add to memory cache
        this.addToMemoryCache(key, value);
    }
    addToMemoryCache(key, value) {
        const size = Buffer.byteLength(value, 'utf8');
        // If adding this entry would exceed memory limit, evict entries
        while (this.currentMemorySize + size > this.maxMemorySize || this.memoryCache.size >= this.maxEntries) {
            this.evictLRU();
        }
        // Add to memory cache
        this.memoryCache.set(key, {
            value,
            timestamp: Date.now(),
            accessCount: 0,
            lastAccessed: Date.now(),
            size
        });
        this.currentMemorySize += size;
    }
    evictLRU() {
        if (this.memoryCache.size === 0)
            return;
        // Find least recently used entry
        let lruKey = null;
        let lruTime = Infinity;
        for (const [key, entry] of this.memoryCache.entries()) {
            if (entry.lastAccessed < lruTime) {
                lruTime = entry.lastAccessed;
                lruKey = key;
            }
        }
        if (lruKey) {
            const entry = this.memoryCache.get(lruKey);
            this.memoryCache.delete(lruKey);
            this.currentMemorySize -= entry.size;
            this.stats.evictions++;
        }
    }
    async initializeFromDisk() {
        try {
            const files = await fs.promises.readdir(this.cacheDir);
            for (const file of files) {
                if (this.currentMemorySize >= this.maxMemorySize)
                    break;
                try {
                    const filePath = path.join(this.cacheDir, file);
                    const data = await fs.promises.readFile(filePath, 'utf8');
                    const entry = JSON.parse(data);
                    // Only load recent and frequently accessed entries into memory
                    const age = Date.now() - entry.timestamp;
                    if (age < 24 * 60 * 60 * 1000 && entry.accessCount > 5) { // 24 hours old and accessed > 5 times
                        const key = path.basename(file, '.cache');
                        this.addToMemoryCache(key, entry.value);
                    }
                }
                catch (error) {
                    console.error(`Error loading cache file ${file}:`, error);
                }
            }
        }
        catch (error) {
            console.error('Error initializing cache from disk:', error);
        }
    }
    async performMaintenance() {
        try {
            const files = await fs.promises.readdir(this.cacheDir);
            const now = Date.now();
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
            for (const file of files) {
                const filePath = path.join(this.cacheDir, file);
                const stats = await fs.promises.stat(filePath);
                // Remove old files
                if (now - stats.mtimeMs > maxAge) {
                    await fs.promises.unlink(filePath);
                }
            }
            // Log cache statistics
            console.log('Cache Statistics:', {
                memoryEntries: this.memoryCache.size,
                memorySize: `${(this.currentMemorySize / 1024 / 1024).toFixed(2)}MB`,
                hitRate: `${((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)}%`,
                evictions: this.stats.evictions,
                totalSaved: `${(this.stats.totalSaved / 1024 / 1024).toFixed(2)}MB`
            });
        }
        catch (error) {
            console.error('Error during cache maintenance:', error);
        }
    }
    async clear() {
        // Clear memory cache
        this.memoryCache.clear();
        this.currentMemorySize = 0;
        // Clear disk cache
        try {
            const files = await fs.promises.readdir(this.cacheDir);
            await Promise.all(files.map(file => fs.promises.unlink(path.join(this.cacheDir, file))));
        }
        catch (error) {
            console.error('Error clearing cache:', error);
        }
        // Reset statistics
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            totalSaved: 0
        };
    }
    getStats() {
        return {
            ...this.stats,
            memorySize: this.currentMemorySize,
            entries: this.memoryCache.size,
            hitRate: (this.stats.hits / (this.stats.hits + this.stats.misses)) || 0
        };
    }
    /**
     * Checks if a result is cached
     * @param cacheType - The type of cache to check
     * @param cacheKey - The key to look up in the cache
     * @returns The cached result or null if not found
     * @complexity O(1) for direct lookup
     */
    async checkCache(cacheType, cacheKey) {
        return CacheService.checkCache(cacheType, cacheKey);
    }
    /**
     * Stores a result in the cache
     * @param cacheType - The type of cache to store in
     * @param cacheKey - The key to store under
     * @param response - The response to cache
     * @returns Promise that resolves when the cache is updated
     * @complexity O(1) for storage operation
     */
    async storeCache(cacheType, cacheKey, response) {
        // The actual implementation returns a CacheResult, but the interface expects void
        await CacheService.storeCache(cacheType, cacheKey, response);
        // We don't return anything as per the interface
    }
    /**
     * Invalidates a cache entry
     * @param cacheType - The type of cache to invalidate
     * @param cacheKey - The key to invalidate
     * @returns Promise that resolves when the cache entry is invalidated
     * @complexity O(1) for direct removal
     */
    // async invalidateCache(cacheType: string, cacheKey: string): Promise<void> {
    //   // The actual implementation returns a boolean, but the interface expects void
    //   await CacheService.invalidateCache(cacheType, cacheKey);
    //   // We don't return anything as per the interface
    // }
    /**
     * Performs maintenance on the cache system
     * @returns Number of items processed
     * @complexity O(n) where n is the number of cache entries
     */
    async performCacheMaintenance() {
        return CacheService.performCacheMaintenance();
    }
    /**
     * Gets cache statistics
     * @param cacheType - The type of cache to get statistics for (optional)
     * @returns Cache statistics including totalItems, hitRate, avgResponseTime, sizeInBytes, and byType
     * @complexity O(n) where n is the number of cache entries
     */
    async getCacheStats(cacheType) {
        // The actual implementation returns a different structure
        const actualStats = await CacheService.getCacheStats(cacheType);
        const stats = {
            totalItems: actualStats.totalItems || 0, // Use actualStats.totalItems, default to 0 if undefined
            hitRate: actualStats.hitRate || 0, // Use actualStats.hitRate, default to 0 if undefined
            avgResponseTime: actualStats.avgResponseTime || 0, // Use actualStats.avgResponseTime, default to 0 if undefined
            sizeInBytes: actualStats.sizeInBytes || 0, // Use actualStats.sizeInBytes, default to 0 if undefined
            byType: actualStats.byType, // Type assertion removed, keep type as is
        };
        return stats;
    }
}
//# sourceMappingURL=CacheServiceAdapter.js.map