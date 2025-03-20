/**
 * Interface defining the contract for thinking model strategies
 * Enhanced with confidence scoring and alternative paths support
 */
import { ThinkingModel, ThinkingStep } from '../models/types.js';
export interface AlternativePath {
    steps: ThinkingStep[];
    confidence: number;
    reasoning: string;
}
export interface StrategyMetrics {
    confidence: number;
    reasoning: string;
    alternativePaths: AlternativePath[];
    tokenEfficiency: number;
    complexityScore: number;
}
export interface IThinkingModelStrategy {
    /**
     * Initialize the strategy with a problem
     * @param problem The problem to solve
     */
    initialize(problem: string): Promise<void>;
    /**
     * Execute the next step in the thinking process with confidence scoring
     * @returns The completed thinking step with confidence score
     */
    executeNextStep(): Promise<ThinkingStep>;
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
     * Get all steps executed in the thinking process
     * @returns Array of thinking steps
     */
    getSteps(): ThinkingStep[];
    /**
     * Get the thinking model configuration
     * @returns The thinking model configuration
     */
    getModel(): ThinkingModel;
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
}
