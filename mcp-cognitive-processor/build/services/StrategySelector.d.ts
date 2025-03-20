/**
 * Production-ready strategy selector for the Masterful Cognitive Processor
 * This service dynamically selects the most appropriate thinking strategy based on problem characteristics
 */
import { IThinkingModelStrategy } from '../interfaces/IThinkingModelStrategy.js';
/**
 * StrategySelector provides intelligent selection of thinking strategies based on problem characteristics
 */
export declare class StrategySelector {
    private static instance;
    private strategyCache;
    private strategyEffectiveness;
    private constructor();
    /**
     * Get the singleton instance
     */
    static getInstance(): StrategySelector;
    /**
     * Select the best strategy for a given problem
     * @param problem The problem to solve
     * @returns The appropriate thinking strategy
     */
    selectStrategy(problem: string): IThinkingModelStrategy;
    /**
     * Analyze problem to identify key characteristics
     * @private
     */
    private analyzeProblem;
    /**
     * Determine the most appropriate strategy based on problem analysis
     * @private
     */
    private determineStrategy;
    /**
     * Simple keyword-based strategy selection (fallback method)
     * @private
     */
    private simpleKeywordSelection;
    /**
     * Update effectiveness metrics for strategy selection
     * This should be called after processing is complete with success metrics
     */
    updateStrategyEffectiveness(strategyName: string, effectivenessScore: number): void;
    /**
     * Calculate complexity score based on multiple factors
     * @private
     */
    private calculateComplexity;
    /**
     * Calculate uncertainty level in the problem
     * @private
     */
    private calculateUncertainty;
    /**
     * Estimate the number of decision branches in the problem
     * @private
     */
    private estimateDecisionBranches;
    /**
     * Calculate how sequential/step-by-step the problem is
     * @private
     */
    private calculateSequentiality;
    /**
     * Calculate the abstraction level of the problem
     * @private
     */
    private calculateAbstractionLevel;
    /**
     * Calculate domain specificity of the problem
     * @private
     */
    private calculateDomainSpecificity;
    /**
     * Determine if the problem contains structured data
     * @private
     */
    private containsStructuredData;
    /**
     * Generate a hash for a string for caching
     * @private
     */
    private hashString;
}
