import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
export class CachingService extends EventEmitter {
    static instance;
    cache;
    config;
    totalSize = 0;
    constructor(config = {}) {
        super();
        this.config = {
            backend: 'memory',
            policy: 'lru',
            maxSize: 100 * 1024 * 1024, // 100MB
            maxEntries: 1000,
            defaultTTL: 3600 * 1000, // 1 hour
            ...config
        };
        this.cache = new Map();
        this.loadPersistedCache();
    }
    static getInstance(config) {
        if (!CachingService.instance) {
            CachingService.instance = new CachingService(config);
        }
        return CachingService.instance;
    }
    generateKey(data) {
        const stringData = typeof data === 'string' ? data : JSON.stringify(data);
        return crypto.createHash('sha256').update(stringData).digest('hex');
    }
    async get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }
        // Check if entry has expired
        if (Date.now() > entry.timestamp + entry.ttl) {
            this.cache.delete(key);
            this.emit('cacheEvict', { key, reason: 'expired' });
            return null;
        }
        // Update metadata for LRU
        if (entry.metadata) {
            entry.metadata.hits++;
            entry.metadata.lastAccessed = Date.now();
        }
        return entry.value;
    }
    async set(key, value, ttl = this.config.defaultTTL) {
        const size = this.calculateSize(value);
        // Check if we need to evict entries
        while (this.shouldEvict(size)) {
            this.evictEntry();
        }
        const entry = {
            key,
            value,
            timestamp: Date.now(),
            ttl,
            metadata: {
                hits: 0,
                lastAccessed: Date.now(),
                size
            }
        };
        this.cache.set(key, entry);
        this.totalSize += size;
        this.emit('cacheSet', { key, size });
        // Persist cache if using file backend
        if (this.config.backend === 'file') {
            this.persistCache();
        }
    }
    async delete(key) {
        const entry = this.cache.get(key);
        if (entry) {
            this.totalSize -= entry.metadata?.size || 0;
            this.cache.delete(key);
            this.emit('cacheDelete', { key });
            return true;
        }
        return false;
    }
    async clear() {
        this.cache.clear();
        this.totalSize = 0;
        this.emit('cacheClear');
    }
    shouldEvict(newEntrySize) {
        return (this.totalSize + newEntrySize > this.config.maxSize ||
            this.cache.size >= this.config.maxEntries);
    }
    evictEntry() {
        let entryToEvict = null;
        switch (this.config.policy) {
            case 'lru':
                entryToEvict = Array.from(this.cache.entries())
                    .reduce((oldest, current) => {
                    return (oldest[1].metadata?.lastAccessed || 0) < (current[1].metadata?.lastAccessed || 0)
                        ? oldest
                        : current;
                });
                break;
            case 'ttl':
                entryToEvict = Array.from(this.cache.entries())
                    .reduce((shortest, current) => {
                    return (shortest[1].timestamp + shortest[1].ttl) < (current[1].timestamp + current[1].ttl)
                        ? shortest
                        : current;
                });
                break;
            case 'size':
                entryToEvict = Array.from(this.cache.entries())
                    .reduce((largest, current) => {
                    return (largest[1].metadata?.size || 0) > (current[1].metadata?.size || 0)
                        ? largest
                        : current;
                });
                break;
        }
        if (entryToEvict) {
            const [key, entry] = entryToEvict;
            this.totalSize -= entry.metadata?.size || 0;
            this.cache.delete(key);
            this.emit('cacheEvict', { key, reason: 'policy' });
        }
    }
    calculateSize(value) {
        return Buffer.byteLength(JSON.stringify(value), 'utf8');
    }
    async persistCache() {
        if (!this.config.persistPath)
            return;
        try {
            const cacheDir = path.dirname(this.config.persistPath);
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }
            const persistData = Array.from(this.cache.entries())
                .filter(([_, entry]) => Date.now() <= entry.timestamp + entry.ttl);
            await fs.promises.writeFile(this.config.persistPath, JSON.stringify(persistData), 'utf8');
        }
        catch (error) {
            console.error('Failed to persist cache:', error);
        }
    }
    async loadPersistedCache() {
        if (!this.config.persistPath || !fs.existsSync(this.config.persistPath)) {
            return;
        }
        try {
            const data = await fs.promises.readFile(this.config.persistPath, 'utf8');
            const entries = JSON.parse(data);
            for (const [key, entry] of entries) {
                if (Date.now() <= entry.timestamp + entry.ttl) {
                    this.cache.set(key, entry);
                    this.totalSize += entry.metadata?.size || 0;
                }
            }
        }
        catch (error) {
            console.error('Failed to load persisted cache:', error);
        }
    }
    getStats() {
        const totalHits = Array.from(this.cache.values())
            .reduce((sum, entry) => sum + (entry.metadata?.hits || 0), 0);
        return {
            entryCount: this.cache.size,
            totalSize: this.totalSize,
            hitRate: totalHits / (totalHits + this.cache.size),
            missRate: 1 - (totalHits / (totalHits + this.cache.size))
        };
    }
}
//# sourceMappingURL=CachingService.js.map