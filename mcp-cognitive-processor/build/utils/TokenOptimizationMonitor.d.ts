import { OptimizationMetrics } from '../models/types.js';
interface TokenMetric {
    timestamp: number;
    originalTokens: number;
    optimizedTokens: number;
    savings: number;
    model: string;
    context?: string;
}
export declare class TokenOptimizationMonitor {
    private static instance;
    private metrics;
    private modelStats;
    private constructor();
    static getInstance(): TokenOptimizationMonitor;
    recordOptimization(originalTokens: number, optimizedTokens: number, model: string, context?: string): void;
    private updateModelStats;
    private pruneOldMetrics;
    getModelStats(model: string): {
        totalSavings: number;
        totalOptimizations: number;
        averageSavingsPercent: number;
    };
    getAllModelStats(): Map<string, {
        totalSavings: number;
        totalOptimizations: number;
        averageSavingsPercent: number;
    }>;
    getRecentMetrics(hours?: number): TokenMetric[];
    getOptimizationTrends(): {
        hourly: OptimizationMetrics[];
        daily: OptimizationMetrics[];
    };
    getContextualPerformance(): Map<string, {
        optimizations: number;
        averageSavings: number;
        bestModel: string;
    }>;
    generateOptimizationReport(): string;
}
export {};
