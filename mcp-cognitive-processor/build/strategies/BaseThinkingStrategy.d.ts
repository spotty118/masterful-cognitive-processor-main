/**
 * Base abstract class for thinking strategies
 * Provides common functionality and required interface for all thinking strategies
 */
import { ThinkingStep, ThinkingModel, ThinkingVisualization } from '../models/types.js';
import { ITokenOptimizer } from '../interfaces/ITokenOptimizer.js';
import { IThinkingModelStrategy, AlternativePath, StrategyMetrics } from '../interfaces/IThinkingModelStrategy.js';
export declare abstract class BaseThinkingStrategy implements IThinkingModelStrategy {
    protected steps: ThinkingStep[];
    protected model: ThinkingModel;
    protected tokenOptimizer: ITokenOptimizer;
    constructor(model: ThinkingModel, tokenOptimizer: ITokenOptimizer);
    /**
     * Get the thinking model configuration
     */
    getModel(): ThinkingModel;
    /**
     * Initialize the strategy with a problem
     */
    abstract initialize(problem: string): Promise<void>;
    /**
     * Execute the next thinking step with confidence score
     */
    abstract executeNextStep(): Promise<ThinkingStep>;
    /**
     * Determine if the strategy should continue executing steps
     */
    abstract shouldContinue(): boolean;
    /**
     * Get the current progress (0-1)
     */
    abstract getProgress(): number;
    /**
     * Generate visualization for the thinking process
     */
    abstract generateVisualization(steps: ThinkingStep[]): ThinkingVisualization;
    /**
     * Create a new thinking step
     */
    protected createStep(description: string, reasoning: string, tokens: number): Promise<ThinkingStep>;
    /**
     * Add a step to the history
     */
    protected addStep(step: ThinkingStep): void;
    /**
     * Get all steps executed so far
     */
    getSteps(): ThinkingStep[];
    /**
     * Calculate token usage for a piece of text
     */
    protected calculateTokenUsage(text: string): number;
    /**
     * Analyze the remaining complexity of the problem
     */
    protected analyzeRemainingComplexity(): {
        complexity: 'low' | 'medium' | 'high';
        estimatedSteps: number;
    };
    /**
     * Check if the strategy is making good progress
     */
    protected isProgressingWell(): boolean;
    /**
     * Estimate remaining steps needed
     */
    private estimateRemainingSteps;
    /**
     * Validate token usage for a piece of content
     */
    protected validateTokenUsage(content: string): Promise<boolean>;
    /**
     * Get default max tokens based on tokenLimit if maxTokens is not defined
     */
    private getDefaultMaxTokens;
    /**
     * Optimize content to fit within token limits
     */
    protected optimizeContent(content: string): Promise<string>;
    /**
     * Get detailed metrics about the thinking process
     * Base implementation provides basic metrics
     */
    getMetrics(): Promise<StrategyMetrics>;
    /**
     * Generate alternative reasoning paths
     * Base implementation returns empty array
     */
    generateAlternativePaths(count: number): Promise<AlternativePath[]>;
    /**
     * Calculate confidence score for current reasoning path
     * Base implementation uses progress and complexity
     */
    calculateConfidence(): Promise<number>;
    /**
     * Get explanation for current confidence score
     * Base implementation provides simple explanation
     */
    explainConfidence(): Promise<string>;
    /**
     * Compare current path with alternatives
     * Base implementation provides basic comparison
     */
    compareAlternativePaths(): Promise<{
        differences: string[];
        tradeoffs: {
            [key: string]: string;
        };
        recommendation: string;
    }>;
    /**
     * Calculate token efficiency metric
     * @protected
     */
    protected calculateTokenEfficiency(): Promise<number>;
}
