/**
 * Factory for creating thinking model strategies
 * @complexity O(1) for initialization and strategy creation
 */

import { IThinkingModelStrategy } from '../interfaces/IThinkingModelStrategy.js';
import { StrategicThinkingStrategy } from '../strategies/StrategicThinkingStrategy.js';
import { DepthFirstStrategy } from '../strategies/DepthFirstStrategy.js';
import { BreadthFirstStrategy } from '../strategies/BreadthFirstStrategy.js';
import { ChainOfThoughtStrategy } from '../strategies/ChainOfThoughtStrategy.js';
import { TreeOfThoughtsStrategy } from '../strategies/TreeOfThoughtsStrategy.js';
import { EnhancedThinkingStrategy } from '../strategies/EnhancedThinkingStrategy.js';
import { mcpConfig } from '../config/mcp-config.js';
import { tokenOptimizer } from '../utils/tokenOptimizer.js';
import { CompositeStrategy } from '../strategies/CompositeStrategy.js';

/**
 * Factory for creating thinking model strategies
 * Implements the Factory pattern for strategy instantiation
 */
export class ThinkingModelStrategyFactory {
  private static readonly strategies = new Map<string, IThinkingModelStrategy>();

  /**
   * Gets a strategy instance for a specific thinking model
   */
  public static getStrategy(modelName: string, compositeConfig?: {
    components?: string[],
    mode?: 'sequential' | 'parallel' | 'weighted',
    weights?: number[]
  }): IThinkingModelStrategy {
    if (!this.strategies.has(modelName)) {
      const strategy = this.createStrategy(modelName, compositeConfig);
      this.strategies.set(modelName, strategy);
    }
    return this.strategies.get(modelName)!;
  }

  private static createStrategy(modelName: string, compositeConfig?: {
    components?: string[],
    mode?: 'sequential' | 'parallel' | 'weighted',
    weights?: number[]
  }): IThinkingModelStrategy {
    const model = mcpConfig.core.thinkingModels.find(m => m.name === modelName);
    if (!model) {
      throw new Error(`Unknown thinking model: ${modelName}`);
    }

    switch (modelName) {
      case 'enhanced':
        return new EnhancedThinkingStrategy(model, tokenOptimizer);
      case 'strategic':
        return new StrategicThinkingStrategy(model, tokenOptimizer);
      case 'depth_first':
        return new DepthFirstStrategy(model, tokenOptimizer);
      case 'breadth_first':
        return new BreadthFirstStrategy(model, tokenOptimizer);
      case 'chain_of_thought':
        return new ChainOfThoughtStrategy(model, tokenOptimizer);
      case 'tree_of_thoughts':
        return new TreeOfThoughtsStrategy(model, tokenOptimizer);
      case 'composite':
        return this.createCompositeStrategy(model, compositeConfig);
      default:
        // Check if it's a composite strategy encoded in JSON
        if (typeof modelName === 'string' && modelName.startsWith('{') && modelName.includes('components')) {
          try {
            const config = JSON.parse(modelName);
            return this.createCompositeStrategy(model, config);
          } catch (e) {
            console.warn(`Failed to parse composite strategy JSON: ${e}`);
          }
        }
        // Default to enhanced thinking for unknown models
        return new EnhancedThinkingStrategy(model, tokenOptimizer);
    }
  }

  /**
   * Create a composite strategy with the specified components
   */
  private static createCompositeStrategy(model: any, config?: {
    components?: string[],
    mode?: 'sequential' | 'parallel' | 'weighted',
    weights?: number[]
  }): IThinkingModelStrategy {
    // Default configuration
    const components = config?.components || ['enhanced', 'tree_of_thoughts', 'chain_of_thought'];
    const mode = config?.mode || 'sequential';
    const weights = config?.weights || components.map(() => 1.0);
    
    // Create component strategies
    const strategies: IThinkingModelStrategy[] = [];
    
    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      // Avoid infinite recursion by checking for composite
      if (component !== 'composite' && !component.includes('composite')) {
        const strategy = this.getStrategy(component);
        strategies.push(strategy);
      }
    }
    
    // Create the composite strategy
    const composite = new CompositeStrategy(model, tokenOptimizer, strategies, mode);
    
    // Apply weights if in weighted mode
    if (mode === 'weighted' && weights.length === strategies.length) {
      for (let i = 0; i < strategies.length; i++) {
        // Update weights using internal method
        (composite as any).strategies[i].weight = weights[i];
      }
    }
    
    return composite;
  }

  // Store the strategy selector instance
  private static strategySelector: any = null;

  /**
   * Gets the optimal strategy for a given problem based on its characteristics
   * This version supports both synchronous and asynchronous selection
   */
  public static getOptimalStrategy(problem: string): IThinkingModelStrategy {
    // For backward compatibility, still use keyword-based selection immediately
    // This ensures existing code works without requiring async/await
    const strategy = this.selectByKeywords(problem);
    
    // Also start async selection process in the background
    // This will help improve future strategy selections through learning
    this.improveStrategySelectionAsync(problem, strategy);
    
    // Return the keyword-based strategy immediately for backward compatibility
    return strategy;
  }

  /**
   * Select a strategy based on keywords in the problem description
   * This provides immediate results without async operations
   * @private
   */
  private static selectByKeywords(problem: string): IThinkingModelStrategy {
    const problemLower = problem.toLowerCase();
    
    // Use enhanced thinking for problems requiring detailed analysis,
    // confidence scoring, or alternative path exploration
    if (problemLower.includes('confidence') ||
        problemLower.includes('alternatives') ||
        problemLower.includes('trade-offs') ||
        problemLower.includes('analyze in detail') ||
        problemLower.includes('complex decision') ||
        problemLower.includes('multiple factors') ||
        problemLower.includes('uncertainty')) {
      return this.getStrategy('enhanced');
    }

    // Analyze problem characteristics to choose the best strategy
    if (problemLower.includes('architecture') ||
        problemLower.includes('design') ||
        problemLower.includes('system')) {
      return this.getStrategy('strategic');
    }
    
    if (problemLower.includes('algorithm') ||
        problemLower.includes('optimize') ||
        problemLower.includes('performance')) {
      return this.getStrategy('depth_first');
    }
    
    if (problemLower.includes('explore') ||
        problemLower.includes('options')) {
      return this.getStrategy('breadth_first');
    }
    
    if (problemLower.includes('explain') ||
        problemLower.includes('reasoning') ||
        problemLower.includes('step by step')) {
      return this.getStrategy('chain_of_thought');
    }
    
    if (problemLower.includes('multiple paths') ||
        problemLower.includes('compare approaches')) {
      return this.getStrategy('tree_of_thoughts');
    }

    // Default to enhanced thinking for better analysis
    return this.getStrategy('enhanced');
  }

  /**
   * Asynchronously improves strategy selection by learning from each problem
   * Does not block the main flow, but will improve future selections
   * @private
   */
  private static async improveStrategySelectionAsync(
    problem: string,
    selectedStrategy: IThinkingModelStrategy
  ): Promise<void> {
    try {
      // Check if dynamic selection is enabled in config
      const dynamicEnabled = mcpConfig.core?.strategies?.dynamicSelection ?? true;
      if (!dynamicEnabled) return;

      // Initialize strategy selector if needed
      if (!this.strategySelector) {
        await this.initializeStrategySelector();
      }

      if (this.strategySelector) {
        // Get the advanced recommendation
        const recommendedStrategy = await this.strategySelector.selectReasoningSystem(problem);
        console.log(`Advanced selector recommended strategy: ${recommendedStrategy.name}`);
        
        // If recommendation differs from keyword selection, log the difference
        // This helps us understand where the advanced selector might be better
        if (recommendedStrategy.name !== selectedStrategy.getModel().name) {
          console.log(`Strategy difference detected - Keyword: ${selectedStrategy.getModel().name}, Advanced: ${recommendedStrategy.name}`);
        }
      }
    } catch (error) {
      // Don't let async errors affect the main process
      console.warn('Error in async strategy improvement:', error);
    }
  }

  /**
   * Get a strategy asynchronously using the advanced selector
   * For use in newer code that supports async/await
   */
  public static async getOptimalStrategyAsync(problem: string): Promise<IThinkingModelStrategy> {
    // Initialize strategy selector if needed
    if (!this.strategySelector) {
      await this.initializeStrategySelector();
    }

    try {
      // Check if dynamic selection is enabled in config
      const dynamicEnabled = mcpConfig.core?.strategies?.dynamicSelection ?? true;
      
      if (dynamicEnabled && this.strategySelector) {
        // Use the advanced selector for dynamic selection
        const recommendedStrategy = await this.strategySelector.selectReasoningSystem(problem);
        console.log(`Using advanced strategy selection: ${recommendedStrategy.name}`);
        return this.getStrategy(recommendedStrategy.name);
      } else {
        // Fall back to basic pattern matching if dynamic selection is disabled
        return this.selectByKeywords(problem);
      }
    } catch (error) {
      console.error('Error in advanced strategy selection:', error);
      // Fall back to keyword matching on error
      return this.selectByKeywords(problem);
    }
  }

  /**
   * Initialize the advanced strategy selector
   * @private
   */
  private static async initializeStrategySelector(): Promise<void> {
    try {
      // Dynamic import to avoid circular dependencies
      const module = await import('../services/strategySelectors/AdvancedStrategySelector.js');
      this.strategySelector = new module.AdvancedStrategySelector(mcpConfig);
      console.log('Advanced strategy selector initialized');
    } catch (error) {
      console.warn('Failed to load advanced strategy selector, using default:', error);
      // Fall back to simple strategy selector
      try {
        const fallbackModule = await import('../services/strategySelectors/DefaultReasoningStrategySelector.js');
        this.strategySelector = new fallbackModule.DefaultReasoningStrategySelector(mcpConfig);
      } catch (fallbackError) {
        console.error('Failed to initialize any strategy selector:', fallbackError);
        this.strategySelector = null;
      }
    }
  }

  /**
   * Clears all cached strategy instances
   */
  public static resetStrategies(): void {
    this.strategies.clear();
  }
}