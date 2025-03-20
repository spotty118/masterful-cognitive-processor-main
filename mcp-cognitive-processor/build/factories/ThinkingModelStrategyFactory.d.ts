/**
 * Factory for creating thinking model strategies
 * @complexity O(1) for initialization and strategy creation
 */
import { IThinkingModelStrategy } from '../interfaces/IThinkingModelStrategy.js';
/**
 * Factory for creating thinking model strategies
 * Implements the Factory pattern for strategy instantiation
 */
export declare class ThinkingModelStrategyFactory {
    private static readonly strategies;
    /**
     * Gets a strategy instance for a specific thinking model
     */
    static getStrategy(modelName: string, compositeConfig?: {
        components?: string[];
        mode?: 'sequential' | 'parallel' | 'weighted';
        weights?: number[];
    }): IThinkingModelStrategy;
    private static createStrategy;
    /**
     * Create a composite strategy with the specified components
     */
    private static createCompositeStrategy;
    private static strategySelector;
    /**
     * Gets the optimal strategy for a given problem based on its characteristics
     * This version supports both synchronous and asynchronous selection
     */
    static getOptimalStrategy(problem: string): IThinkingModelStrategy;
    /**
     * Select a strategy based on keywords in the problem description
     * This provides immediate results without async operations
     * @private
     */
    private static selectByKeywords;
    /**
     * Asynchronously improves strategy selection by learning from each problem
     * Does not block the main flow, but will improve future selections
     * @private
     */
    private static improveStrategySelectionAsync;
    /**
     * Get a strategy asynchronously using the advanced selector
     * For use in newer code that supports async/await
     */
    static getOptimalStrategyAsync(problem: string): Promise<IThinkingModelStrategy>;
    /**
     * Initialize the advanced strategy selector
     * @private
     */
    private static initializeStrategySelector;
    /**
     * Clears all cached strategy instances
     */
    static resetStrategies(): void;
}
