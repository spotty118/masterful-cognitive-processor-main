/**
 * Token optimization utilities
 * Provides shared token optimization functionality
 */
import { TokenOptimizerImpl } from './TokenOptimizerImpl.js';
declare const tokenOptimizer: TokenOptimizerImpl;
/**
 * Optimize token usage for text
 */
export declare function optimizeTokenUsage(text: string, context?: {}): import("../models/types.js").OptimizationResult;
/**
 * Estimate token count for text
 */
export declare function estimateTokenCount(text: string, model?: string): number;
/**
 * Update token metrics
 */
export declare function updateTokenMetrics(problemId: string, estimatedTokens: number, actualTokens: number, model: string): void;
/**
 * Get token optimization statistics
 */
export declare function getTokenOptimizationStats(): {
    totalOptimizations: number;
    averageSavings: number;
    topPatterns: Array<{
        pattern: string;
        occurrences: number;
        averageSavings: number;
    }>;
};
/**
 * Perform optimization maintenance
 */
export declare function performOptimizationMaintenance(): Promise<number>;
export { tokenOptimizer };
