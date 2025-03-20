import { Thought } from '../types/ThinkingModel.js';
interface MemoryThresholds {
    warning: number;
    critical: number;
}
interface MemoryStats {
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
    usage: number;
}
export declare class MemoryManager {
    private static instance;
    private performanceMonitor;
    private thresholds;
    private gcInterval;
    private lastGC;
    private readonly minGCInterval;
    private memoryHistory;
    private memoryItems;
    private readonly MAX_MEMORY_ITEMS;
    private constructor();
    static getInstance(): MemoryManager;
    storeThought(thought: Thought): void;
    getThought(id: string): Thought | undefined;
    searchMemory(query: string): Thought[];
    getRecentMemories(limit?: number): Thought[];
    private pruneOldMemories;
    private startMonitoring;
    private checkMemoryUsage;
    private getMemoryStats;
    private handleCriticalMemory;
    private handleWarningMemory;
    private forceGarbageCollection;
    private cleanupHistory;
    getMemoryReport(): string;
    getMemoryHistory(hours?: number): Array<{
        timestamp: number;
        stats: MemoryStats;
    }>;
    updateThresholds(thresholds: Partial<MemoryThresholds>): void;
    getMemoryTrends(): {
        hourly: Array<{
            timestamp: number;
            averageUsage: number;
        }>;
        daily: Array<{
            timestamp: number;
            averageUsage: number;
        }>;
    };
}
export {};
