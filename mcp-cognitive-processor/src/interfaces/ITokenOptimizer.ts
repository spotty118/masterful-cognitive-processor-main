/**
 * Interface for token optimization capabilities
 * Defines methods for optimizing and managing token usage
 */

import { 
  OptimizationResult, 
  OptimizationContext,
  TokenOptimizationConfig 
} from '../models/types.js';

export interface ITokenOptimizer {
  /**
   * Optimizes token usage for a given text
   * @param text - The text to optimize
   * @param context - Optional optimization context
   * @returns Optimization result with token estimates and suggestions
   */
  optimizeTokenUsage(text: string, context?: OptimizationContext): OptimizationResult;

  /**
   * Updates token metrics with actual usage data
   * @param problemId - Unique identifier for the problem
   * @param estimatedTokens - Number of tokens estimated
   * @param actualTokens - Number of tokens actually used
   * @param model - The model used for generation
   */
  updateTokenMetrics(
    problemId: string,
    estimatedTokens: number,
    actualTokens: number,
    model: string
  ): void;

  /**
   * Gets statistics about token optimization
   * @returns Token optimization statistics
   */
  getTokenOptimizationStats(): {
    totalOptimizations: number;
    averageSavings: number;
    topPatterns: Array<{
      pattern: string;
      occurrences: number;
      averageSavings: number;
    }>;
  };

  /**
   * Estimates token count for a given text
   * @param text - The text to estimate tokens for
   * @param model - Optional model to use for estimation
   * @returns Estimated token count
   */
  estimateTokenCount(text: string, model?: string): number;

  /**
   * Performs maintenance on token optimization system
   * @returns Number of items cleaned up
   */
  performOptimizationMaintenance(): Promise<number>;
}
