/**
 * CompositeStrategy
 * Combines multiple thinking strategies to leverage their strengths
 * Implements the composite design pattern for strategy composition
 */
import { ThinkingStep, ThinkingModel, ThinkingVisualization } from '../models/types.js';
import { ITokenOptimizer } from '../interfaces/ITokenOptimizer.js';
import { IThinkingModelStrategy, AlternativePath, StrategyMetrics } from '../interfaces/IThinkingModelStrategy.js';
import { BaseThinkingStrategy } from './BaseThinkingStrategy.js';
/**
 * CompositeStrategy combines multiple thinking strategies into a unified approach
 * It can operate in different modes: sequential, parallel, or weighted
 */
export declare class CompositeStrategy extends BaseThinkingStrategy {
    private strategies;
    private mode;
    private problemContext;
    private feedbackEnabled;
    private strategyPerformance;
    private currentConfidence;
    private confidenceReasoning;
    private alternativePaths;
    constructor(model: ThinkingModel, tokenOptimizer: ITokenOptimizer, strategies?: IThinkingModelStrategy[], mode?: 'sequential' | 'parallel' | 'weighted');
    /**
     * Add a strategy to the composite with a specific weight
     */
    addStrategy(strategy: IThinkingModelStrategy, weight?: number): void;
    /**
     * Initialize all strategies with the problem
     * @param problem The problem to solve
     */
    initialize(problem: string): Promise<void>;
    /**
     * Execute the next step in the thinking process
     * @returns The completed thinking step with confidence score
     */
    executeNextStep(): Promise<ThinkingStep>;
    /**
     * Generate the next thinking step by combining multiple strategies
     * Internal implementation - not part of the public interface
     */
    private nextStep;
    /**
     * Sequential mode: Use strategies one after another
     */
    private sequentialNextStep;
    /**
     * Parallel mode: Get suggestions from all strategies and choose the best one
     */
    private parallelNextStep;
    /**
     * Weighted mode: Use strategy weights to determine which one to use
     */
    private weightedNextStep;
    /**
     * Select the best step from multiple candidates
     */
    private selectBestStep;
    /**
     * Update strategy performance metrics
     */
    private updateStrategyPerformance;
    /**
     * Check if the thinking process should continue
     * @returns True if more steps are needed, false if complete
     */
    shouldContinue(): boolean;
    /**
     * Get the current progress of the thinking process
     * @returns Progress as a percentage (0-100)
     */
    getProgress(): number;
    /**
     * Generate a visualization of the thinking process
     * @returns A visualization of the thinking process
     */
    /**
     * Generate visualization for the thinking process
     * @param steps Optional array of thinking steps to visualize
     * @returns Visualization of the thinking process
     */
    generateVisualization(steps?: ThinkingStep[]): ThinkingVisualization;
    /**
     * Get detailed metrics about the thinking process
     * @returns Strategy metrics including confidence and alternative paths
     */
    getMetrics(): Promise<StrategyMetrics>;
    /**
     * Generate alternative reasoning paths
     * @param count Number of alternative paths to generate
     * @returns Array of alternative reasoning paths
     */
    generateAlternativePaths(count: number): Promise<AlternativePath[]>;
    /**
     * Calculate confidence score for current reasoning path
     * @returns Confidence score between 0 and 1
     */
    calculateConfidence(): Promise<number>;
    /**
     * Get explanation for current confidence score
     * @returns Detailed explanation of confidence calculation
     */
    explainConfidence(): Promise<string>;
    /**
     * Compare current path with alternatives
     * @returns Analysis of path differences and trade-offs
     */
    compareAlternativePaths(): Promise<{
        differences: string[];
        tradeoffs: {
            [key: string]: string;
        };
        recommendation: string;
    }>;
    /**
     * Calculate token efficiency score
     * Override the token efficiency calculation to use composite strategy logic
     * @returns Promise with token efficiency score between 0 and 1
     */
    protected calculateTokenEfficiency(): Promise<number>;
    /**
     * Calculate complexity score for the thinking process
     * @returns Complexity score between 0 and 1
     */
    private calculateComplexityScore;
    /**
     * Get current strategy performance metrics
     * Internal helper method
     */
    private getStrategyMetricsInternal;
    /**
     * Calculate average tokens across steps
     */
    private calculateAverageTokens;
    /**
     * Get all thinking steps
     */
    getSteps(): ThinkingStep[];
    /**
     * Get alternative paths that were considered
     * Internal helper method that aggregates paths from component strategies
     */
    private getAlternativePathsInternal;
    /**
     * Generate thinking visualizations
     * Internal helper method that creates visualizations
     */
    private visualize;
}
