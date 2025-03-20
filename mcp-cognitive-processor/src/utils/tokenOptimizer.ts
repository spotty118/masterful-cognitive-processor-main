/**
 * Token optimization utilities
 * Provides shared token optimization functionality
 */

import { TokenOptimizerImpl } from './TokenOptimizerImpl.js';

// Create singleton instance for shared use
const tokenOptimizer = TokenOptimizerImpl.getInstance();

// Initialize the token optimizer
(async () => {
  try {
    await tokenOptimizer.init();
    console.log('Token optimizer initialized successfully');
  } catch (error) {
    console.error('Error initializing token optimizer:', error);
  }
})();

/**
 * Optimize token usage for text
 */
export function optimizeTokenUsage(text: string, context = {}) {
  return tokenOptimizer.optimizeTokenUsage(text, context);
}

/**
 * Estimate token count for text
 */
export function estimateTokenCount(text: string, model?: string) {
  return tokenOptimizer.estimateTokenCount(text, model);
}

/**
 * Update token metrics
 */
export function updateTokenMetrics(
  problemId: string,
  estimatedTokens: number,
  actualTokens: number,
  model: string
) {
  return tokenOptimizer.updateTokenMetrics(problemId, estimatedTokens, actualTokens, model);
}

/**
 * Get token optimization statistics
 */
export function getTokenOptimizationStats() {
  return tokenOptimizer.getTokenOptimizationStats();
}

/**
 * Perform optimization maintenance
 */
export async function performOptimizationMaintenance() {
  return tokenOptimizer.performOptimizationMaintenance();
}

// Export the tokenOptimizer instance and utility functions
export {
  tokenOptimizer
};