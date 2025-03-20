import { PerformanceMonitor } from './PerformanceMonitor.js';
export class MemoryManager {
    static instance;
    performanceMonitor;
    thresholds;
    gcInterval = null;
    lastGC = 0;
    minGCInterval = 30000; // Minimum 30 seconds between forced GC
    memoryHistory = [];
    memoryItems;
    MAX_MEMORY_ITEMS = 1000;
    constructor() {
        this.performanceMonitor = PerformanceMonitor.getInstance();
        this.thresholds = {
            warning: 512, // 512MB
            critical: 768 // 768MB
        };
        this.memoryItems = new Map();
        // Start monitoring
        this.startMonitoring();
    }
    static getInstance() {
        if (!MemoryManager.instance) {
            MemoryManager.instance = new MemoryManager();
        }
        return MemoryManager.instance;
    }
    storeThought(thought) {
        this.memoryItems.set(thought.id, thought);
        this.pruneOldMemories();
    }
    getThought(id) {
        return this.memoryItems.get(id);
    }
    searchMemory(query) {
        const queryWords = query.toLowerCase().split(' ');
        const results = [];
        this.memoryItems.forEach(thought => {
            const thoughtWords = thought.content.toLowerCase().split(' ');
            const matchCount = queryWords.filter(word => thoughtWords.includes(word)).length;
            const relevance = matchCount / queryWords.length;
            if (relevance > 0) {
                results.push([thought, relevance]);
            }
        });
        // Sort by relevance and return top matches
        return results
            .sort(([, a], [, b]) => b - a)
            .map(([thought]) => thought)
            .slice(0, 10);
    }
    getRecentMemories(limit = 10) {
        return Array.from(this.memoryItems.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }
    pruneOldMemories() {
        if (this.memoryItems.size > this.MAX_MEMORY_ITEMS) {
            // Sort by timestamp and remove oldest items
            const sortedMemories = Array.from(this.memoryItems.entries())
                .sort(([, a], [, b]) => b.timestamp - a.timestamp);
            const toKeep = sortedMemories.slice(0, this.MAX_MEMORY_ITEMS);
            this.memoryItems = new Map(toKeep);
        }
    }
    startMonitoring() {
        // Monitor memory usage every 5 seconds
        setInterval(() => {
            this.checkMemoryUsage();
        }, 5000);
        // Cleanup old history every hour
        setInterval(() => {
            this.cleanupHistory();
        }, 3600000);
    }
    checkMemoryUsage() {
        const stats = this.getMemoryStats();
        const usageInMB = stats.usage;
        // Record stats
        this.memoryHistory.push({
            timestamp: Date.now(),
            stats
        });
        // Check thresholds
        if (usageInMB >= this.thresholds.critical) {
            this.handleCriticalMemory();
        }
        else if (usageInMB >= this.thresholds.warning) {
            this.handleWarningMemory();
        }
        // Record metric
        this.performanceMonitor.recordMetric('memory_check', 0, true, {
            metadata: {
                heapUsed: stats.heapUsed,
                heapTotal: stats.heapTotal,
                usage: usageInMB
            }
        });
    }
    getMemoryStats() {
        const stats = process.memoryUsage();
        return {
            heapUsed: stats.heapUsed,
            heapTotal: stats.heapTotal,
            external: stats.external,
            arrayBuffers: stats.arrayBuffers || 0,
            usage: Math.round(stats.heapUsed / 1024 / 1024) // Convert to MB
        };
    }
    async handleCriticalMemory() {
        console.warn('Critical memory usage detected!');
        // Force garbage collection if enough time has passed
        if (Date.now() - this.lastGC >= this.minGCInterval) {
            await this.forceGarbageCollection();
        }
        // Notify performance monitor
        this.performanceMonitor.recordMetric('critical_memory', 0, false, {
            errorType: 'CRITICAL_MEMORY',
            metadata: this.getMemoryStats()
        });
    }
    handleWarningMemory() {
        console.warn('High memory usage warning');
        // Record warning
        this.performanceMonitor.recordMetric('memory_warning', 0, true, {
            metadata: this.getMemoryStats()
        });
    }
    async forceGarbageCollection() {
        if (global.gc) {
            const startTime = Date.now();
            try {
                global.gc();
                this.lastGC = Date.now();
                // Record successful GC
                this.performanceMonitor.recordMetric('garbage_collection', Date.now() - startTime, true, {
                    metadata: {
                        memoryBefore: this.memoryHistory[this.memoryHistory.length - 1]?.stats,
                        memoryAfter: this.getMemoryStats()
                    }
                });
            }
            catch (error) {
                console.error('Error during garbage collection:', error);
                // Record failed GC
                this.performanceMonitor.recordMetric('garbage_collection', Date.now() - startTime, false, {
                    errorType: 'GC_ERROR',
                    metadata: { error: error instanceof Error ? error.message : String(error) }
                });
            }
        }
    }
    cleanupHistory() {
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        this.memoryHistory = this.memoryHistory.filter(entry => entry.timestamp > oneDayAgo);
    }
    getMemoryReport() {
        const currentStats = this.getMemoryStats();
        const history = this.getMemoryHistory();
        let report = '=== Memory Usage Report ===\n\n';
        // Current status
        report += 'Current Memory Usage:\n';
        report += `Heap Used: ${(currentStats.heapUsed / 1024 / 1024).toFixed(2)} MB\n`;
        report += `Heap Total: ${(currentStats.heapTotal / 1024 / 1024).toFixed(2)} MB\n`;
        report += `External: ${(currentStats.external / 1024 / 1024).toFixed(2)} MB\n`;
        report += `Array Buffers: ${(currentStats.arrayBuffers / 1024 / 1024).toFixed(2)} MB\n\n`;
        // Usage trends
        if (history.length > 0) {
            const avgUsage = history.reduce((sum, h) => sum + h.stats.usage, 0) / history.length;
            const maxUsage = Math.max(...history.map(h => h.stats.usage));
            const minUsage = Math.min(...history.map(h => h.stats.usage));
            report += 'Memory Trends (Last 24h):\n';
            report += `Average Usage: ${avgUsage.toFixed(2)} MB\n`;
            report += `Peak Usage: ${maxUsage.toFixed(2)} MB\n`;
            report += `Minimum Usage: ${minUsage.toFixed(2)} MB\n\n`;
        }
        // GC stats
        const gcMetrics = this.performanceMonitor.getServiceMetrics('garbage_collection');
        if (gcMetrics.totalCalls > 0) {
            report += 'Garbage Collection Stats:\n';
            report += `Total GC Runs: ${gcMetrics.totalCalls}\n`;
            report += `Success Rate: ${((gcMetrics.successCount / gcMetrics.totalCalls) * 100).toFixed(2)}%\n`;
            report += `Average Duration: ${gcMetrics.averageLatency.toFixed(2)}ms\n`;
        }
        return report;
    }
    getMemoryHistory(hours = 24) {
        const cutoff = Date.now() - (hours * 60 * 60 * 1000);
        return this.memoryHistory.filter(entry => entry.timestamp >= cutoff);
    }
    updateThresholds(thresholds) {
        this.thresholds = {
            ...this.thresholds,
            ...thresholds
        };
    }
    getMemoryTrends() {
        const now = Date.now();
        const hourly = [];
        const daily = [];
        // Calculate hourly averages for the last 24 hours
        for (let i = 0; i < 24; i++) {
            const hourStart = now - ((i + 1) * 60 * 60 * 1000);
            const hourEnd = now - (i * 60 * 60 * 1000);
            const hourData = this.memoryHistory.filter(entry => entry.timestamp >= hourStart && entry.timestamp < hourEnd);
            if (hourData.length > 0) {
                const avgUsage = hourData.reduce((sum, entry) => sum + entry.stats.usage, 0) / hourData.length;
                hourly.unshift({
                    timestamp: hourStart,
                    averageUsage: avgUsage
                });
            }
        }
        // Calculate daily averages for the last 7 days
        for (let i = 0; i < 7; i++) {
            const dayStart = now - ((i + 1) * 24 * 60 * 60 * 1000);
            const dayEnd = now - (i * 24 * 60 * 60 * 1000);
            const dayData = this.memoryHistory.filter(entry => entry.timestamp >= dayStart && entry.timestamp < dayEnd);
            if (dayData.length > 0) {
                const avgUsage = dayData.reduce((sum, entry) => sum + entry.stats.usage, 0) / dayData.length;
                daily.unshift({
                    timestamp: dayStart,
                    averageUsage: avgUsage
                });
            }
        }
        return { hourly, daily };
    }
}
//# sourceMappingURL=MemoryManager.js.map