/**
 * Cache Service Implementation
 * Provides file-based caching with statistics tracking
 */
import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import * as zlib from 'zlib';
import { promisify } from 'util';
// Promisify zlib methods for async/await
const gzipAsync = promisify(zlib.gzip);
const gunzipAsync = promisify(zlib.gunzip);
// Define the database file path
const DB_DIR = process.env.MCP_DB_DIR || path.join(process.cwd(), 'data');
const CACHE_DIR = path.join(DB_DIR, 'cache');
// Cache configuration
const CACHE_TTL = {
    default: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    reasoning_cache: 48 * 60 * 60 * 1000, // 48 hours
    thinking_cache: 24 * 60 * 60 * 1000, // 24 hours
    generation_cache: 7 * 24 * 60 * 60 * 1000 // 7 days
};
// Simple in-memory LRU cache implementation
class MemoryCache {
    cache;
    maxSize;
    constructor(maxSize = 1000) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }
    get(key) {
        const item = this.cache.get(key);
        if (!item)
            return null;
        // Check expiration
        if (item.expires < Date.now()) {
            this.cache.delete(key);
            return null;
        }
        // Move to end for LRU (most recently used)
        this.cache.delete(key);
        this.cache.set(key, item);
        return item.value;
    }
    set(key, value, ttl) {
        // If cache is full, remove oldest item (first item in map)
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, {
            value,
            expires: Date.now() + ttl
        });
    }
    clear() {
        this.cache.clear();
    }
    size() {
        return this.cache.size;
    }
}
// Initialize memory cache
const memoryCache = new MemoryCache(500);
let cacheStats = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    responseTime: [],
    sizeInBytes: 0,
    memoryItems: 0,
    byType: {}
};
// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}
/**
 * Gets the path to a cache type's directory
 */
const getCacheTypeDir = (cacheType) => {
    const dir = path.join(CACHE_DIR, cacheType);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
};
/**
 * Generates a full cache key from type and key
 */
const generateFullCacheKey = (cacheType, cacheKey) => {
    return `${cacheType}:${cacheKey}`;
};
/**
 * Checks if a result is cached (multi-level: memory → disk)
 */
export const checkCache = async (cacheType, cacheKey) => {
    const startTime = Date.now();
    cacheStats.totalRequests++;
    try {
        const fullCacheKey = generateFullCacheKey(cacheType, cacheKey);
        // Step 1: Check memory cache first (faster)
        const memoryCacheResult = memoryCache.get(fullCacheKey);
        if (memoryCacheResult) {
            // Memory cache hit
            cacheStats.hits++;
            if (!cacheStats.byType[cacheType]) {
                cacheStats.byType[cacheType] = { hits: 1, misses: 0, items: 1 };
            }
            else {
                cacheStats.byType[cacheType].hits++;
            }
            // Record response time
            const responseTime = Date.now() - startTime;
            cacheStats.responseTime.push(responseTime);
            if (cacheStats.responseTime.length > 1000) {
                cacheStats.responseTime = cacheStats.responseTime.slice(-1000);
            }
            return memoryCacheResult;
        }
        // Step 2: Check disk cache
        const cacheDir = getCacheTypeDir(cacheType);
        const cacheFilePath = path.join(cacheDir, `${createHash('md5').update(cacheKey).digest('hex')}.json`);
        if (!fs.existsSync(cacheFilePath)) {
            // Cache miss
            cacheStats.misses++;
            if (!cacheStats.byType[cacheType]) {
                cacheStats.byType[cacheType] = { hits: 0, misses: 1, items: 0 };
            }
            else {
                cacheStats.byType[cacheType].misses++;
            }
            return null;
        }
        // Read and parse disk cache
        const data = await fs.promises.readFile(cacheFilePath, 'utf8');
        let cacheItem;
        try {
            // Try to decompress if it's compressed
            if (data.startsWith('{"compressed":true')) {
                const compressedData = JSON.parse(data);
                if (compressedData.compressed && compressedData.data) {
                    const buffer = Buffer.from(compressedData.data, 'base64');
                    const decompressedData = await gunzipAsync(buffer);
                    cacheItem = JSON.parse(decompressedData.toString());
                }
                else {
                    cacheItem = JSON.parse(data);
                }
            }
            else {
                cacheItem = JSON.parse(data);
            }
        }
        catch (parseError) {
            // Fallback if decompression fails
            cacheItem = JSON.parse(data);
        }
        // Check for TTL-based expiration
        const ttl = CACHE_TTL[cacheType] || CACHE_TTL.default;
        const timestamp = new Date(cacheItem.timestamp || Date.now()).getTime();
        if (Date.now() - timestamp > ttl) {
            // Cache expired
            await fs.promises.unlink(cacheFilePath).catch(() => { });
            cacheStats.misses++;
            if (!cacheStats.byType[cacheType]) {
                cacheStats.byType[cacheType] = { hits: 0, misses: 1, items: 0 };
            }
            else {
                cacheStats.byType[cacheType].misses++;
            }
            return null;
        }
        // Store in memory cache for faster subsequent access
        memoryCache.set(fullCacheKey, cacheItem, ttl);
        cacheStats.memoryItems = memoryCache.size();
        // Cache hit
        cacheStats.hits++;
        if (!cacheStats.byType[cacheType]) {
            cacheStats.byType[cacheType] = { hits: 1, misses: 0, items: 1 };
        }
        else {
            cacheStats.byType[cacheType].hits++;
        }
        // Record response time
        const responseTime = Date.now() - startTime;
        cacheStats.responseTime.push(responseTime);
        if (cacheStats.responseTime.length > 1000) {
            cacheStats.responseTime = cacheStats.responseTime.slice(-1000);
        }
        return cacheItem;
    }
    catch (error) {
        console.error(`Error checking cache (${cacheType}/${cacheKey}):`, error);
        cacheStats.misses++;
        if (!cacheStats.byType[cacheType]) {
            cacheStats.byType[cacheType] = { hits: 0, misses: 1, items: 0 };
        }
        else {
            cacheStats.byType[cacheType].misses++;
        }
        return null;
    }
};
/**
 * Stores a result in the cache (multi-level: memory + disk)
 */
export const storeCache = async (cacheType, cacheKey, response) => {
    try {
        const cacheDir = getCacheTypeDir(cacheType);
        const fullCacheKey = generateFullCacheKey(cacheType, cacheKey);
        const cacheItem = {
            response,
            timestamp: new Date().toISOString()
        };
        // Get appropriate TTL based on cache type
        const ttl = CACHE_TTL[cacheType] || CACHE_TTL.default;
        // Store in memory cache
        memoryCache.set(fullCacheKey, cacheItem, ttl);
        cacheStats.memoryItems = memoryCache.size();
        // Determine if compression is needed (for responses larger than 10KB)
        const shouldCompress = response.length > 10 * 1024;
        let fileContent;
        if (shouldCompress) {
            // Compress the data
            const compressedBuffer = await gzipAsync(Buffer.from(JSON.stringify(cacheItem)));
            fileContent = JSON.stringify({
                compressed: true,
                data: compressedBuffer.toString('base64'),
                timestamp: new Date().toISOString()
            });
        }
        else {
            fileContent = JSON.stringify(cacheItem, null, 2);
        }
        // Store on disk
        const cacheFilePath = path.join(cacheDir, `${createHash('md5').update(cacheKey).digest('hex')}.json`);
        await fs.promises.writeFile(cacheFilePath, fileContent);
        // Update stats
        if (!cacheStats.byType[cacheType]) {
            cacheStats.byType[cacheType] = { hits: 0, misses: 0, items: 1 };
        }
        else {
            cacheStats.byType[cacheType].items++;
        }
        // Update size
        const stats = await fs.promises.stat(cacheFilePath);
        cacheStats.sizeInBytes += stats.size;
    }
    catch (error) {
        console.error(`Error storing cache (${cacheType}/${cacheKey}):`, error);
    }
};
/**
 * Gets statistics about the cache system
 */
export const getCacheStats = async (cacheType) => {
    // Update total items and size
    let totalItems = 0;
    let totalSize = 0;
    const updateStatsForDir = async (dir) => {
        const files = await fs.promises.readdir(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = await fs.promises.stat(filePath);
            if (stats.isDirectory()) {
                await updateStatsForDir(filePath);
            }
            else if (file.endsWith('.json')) {
                totalItems++;
                totalSize += stats.size;
            }
        }
    };
    await updateStatsForDir(CACHE_DIR);
    cacheStats.sizeInBytes = totalSize;
    // Calculate average response time
    const avgResponseTime = cacheStats.responseTime.length > 0
        ? cacheStats.responseTime.reduce((a, b) => a + b) / cacheStats.responseTime.length
        : 0;
    // Calculate hit rate
    const hitRate = cacheStats.totalRequests > 0
        ? cacheStats.hits / cacheStats.totalRequests
        : 0;
    if (cacheType) {
        // Return stats for specific cache type
        const typeStats = cacheStats.byType[cacheType] || { hits: 0, misses: 0, items: 0 };
        return {
            totalItems: typeStats.items,
            hitRate: (typeStats.hits + typeStats.misses) > 0
                ? typeStats.hits / (typeStats.hits + typeStats.misses)
                : 0,
            avgResponseTime,
            sizeInBytes: totalSize,
            memoryItems: cacheStats.memoryItems,
            total: typeStats.items
        };
    }
    // Return overall stats
    return {
        totalItems,
        hitRate,
        avgResponseTime,
        sizeInBytes: totalSize,
        memoryItems: cacheStats.memoryItems,
        total: totalItems, // Add total property for backward compatibility
        byType: Object.entries(cacheStats.byType).reduce((acc, [type, stats]) => ({
            ...acc,
            [type]: {
                items: stats.items,
                hitRate: (stats.hits + stats.misses) > 0
                    ? stats.hits / (stats.hits + stats.misses)
                    : 0
            }
        }), {})
    };
};
/**
 * Performs maintenance on the cache system
 */
export const performCacheMaintenance = async () => {
    let cleanedItems = 0;
    const now = Date.now();
    // Clear memory cache (simpler approach)
    memoryCache.clear();
    cacheStats.memoryItems = 0;
    const cleanDirectory = async (dir) => {
        const files = await fs.promises.readdir(dir);
        // Process files in parallel for faster maintenance
        const cleanupPromises = files.map(async (file) => {
            const filePath = path.join(dir, file);
            const stats = await fs.promises.stat(filePath);
            if (stats.isDirectory()) {
                await cleanDirectory(filePath);
                return 0;
            }
            else if (file.endsWith('.json')) {
                try {
                    const data = await fs.promises.readFile(filePath, 'utf8');
                    // Handle compressed files
                    let cacheItem;
                    if (data.startsWith('{"compressed":true')) {
                        cacheItem = JSON.parse(data);
                    }
                    else {
                        cacheItem = JSON.parse(data);
                    }
                    const timestamp = new Date(cacheItem.timestamp).getTime();
                    const cacheType = path.basename(path.dirname(filePath));
                    const ttl = CACHE_TTL[cacheType] || CACHE_TTL.default;
                    if (now - timestamp > ttl) {
                        await fs.promises.unlink(filePath);
                        return 1; // Cleaned one item
                    }
                }
                catch (error) {
                    console.error(`Error cleaning cache file ${filePath}:`, error);
                    // Remove corrupted cache files
                    await fs.promises.unlink(filePath);
                    return 1; // Cleaned one item
                }
            }
            return 0;
        });
        // Wait for all cleanup operations to complete
        const results = await Promise.all(cleanupPromises);
        cleanedItems += results.reduce((sum, val) => sum + val, 0);
    };
    try {
        await cleanDirectory(CACHE_DIR);
        // Reset stats after maintenance
        cacheStats = {
            hits: 0,
            misses: 0,
            totalRequests: 0,
            responseTime: [],
            sizeInBytes: 0,
            memoryItems: 0,
            byType: {}
        };
        console.log(`Cache maintenance completed: ${cleanedItems} items removed`);
        return cleanedItems;
    }
    catch (error) {
        console.error('Error performing cache maintenance:', error);
        return 0;
    }
};
// Export as both named exports and as default object
export default {
    checkCache,
    storeCache,
    getCacheStats,
    performCacheMaintenance
};
//# sourceMappingURL=cacheService.js.map