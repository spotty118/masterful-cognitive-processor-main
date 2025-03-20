/**
 * Token History Service
 * Tracks and analyzes token usage patterns over time
 */
import { TokenPredictionResult } from '../models/types.js';
/**
 * Records a new token usage event
 */
export declare const recordTokenUsage: (prompt: string, model: string, tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
}) => Promise<void>;
/**
 * Predicts token usage for a given prompt
 */
export declare const predictTokenUsage: (prompt: string, model?: string) => Promise<TokenPredictionResult>;
/**
 * Gets token usage statistics
 */
export declare const getTokenStats: () => Promise<{
    totalQueries: number;
    totalTokensUsed: number;
    averageTokensPerQuery: number;
    modelStats: Record<string, {
        queries: number;
        totalTokens: number;
        averageTokens: number;
    }>;
    frequentPatterns: Array<{
        pattern: string;
        occurrences: number;
        averageTokens: number;
    }>;
}>;
/**
 * Performs maintenance on token history
 */
export declare const performTokenHistoryMaintenance: () => Promise<number>;
declare const _default: {
    recordTokenUsage: (prompt: string, model: string, tokenUsage: {
        prompt: number;
        completion: number;
        total: number;
    }) => Promise<void>;
    predictTokenUsage: (prompt: string, model?: string) => Promise<TokenPredictionResult>;
    getTokenStats: () => Promise<{
        totalQueries: number;
        totalTokensUsed: number;
        averageTokensPerQuery: number;
        modelStats: Record<string, {
            queries: number;
            totalTokens: number;
            averageTokens: number;
        }>;
        frequentPatterns: Array<{
            pattern: string;
            occurrences: number;
            averageTokens: number;
        }>;
    }>;
    performTokenHistoryMaintenance: () => Promise<number>;
};
export default _default;
