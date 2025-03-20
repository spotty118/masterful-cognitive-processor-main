/**
 * Base abstract class for thinking strategies
 * Provides common functionality and required interface for all thinking strategies
 */

import { ThinkingStep, ThinkingModel, ThinkingVisualization } from '../models/types.js';
import { tokenOptimizer } from '../utils/tokenOptimizer.js';
import { ITokenOptimizer } from '../interfaces/ITokenOptimizer.js';
import { IThinkingModelStrategy, AlternativePath, StrategyMetrics } from '../interfaces/IThinkingModelStrategy.js';

export abstract class BaseThinkingStrategy implements IThinkingModelStrategy {
  protected steps: ThinkingStep[] = [];
  protected model: ThinkingModel;
  protected tokenOptimizer: ITokenOptimizer;
  
  constructor(model: ThinkingModel, tokenOptimizer: ITokenOptimizer) {
    this.model = model;
    this.tokenOptimizer = tokenOptimizer;
  }

  /**
   * Get the thinking model configuration
   */
  getModel(): ThinkingModel {
    return this.model;
  }

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
  protected async createStep(
    description: string,
    reasoning: string,
    tokens: number
  ): Promise<ThinkingStep> {
    // Calculate default confidence based on progress and complexity
    const complexity = this.analyzeRemainingComplexity();
    const progress = this.getProgress();
    const defaultConfidence = Math.min(
      (progress * 0.7) + (complexity.complexity === 'low' ? 0.3 :
                       complexity.complexity === 'medium' ? 0.2 : 0.1),
      0.95
    );

    // Create metrics
    const metrics = {
      complexityScore: complexity.complexity === 'low' ? 0.3 :
                      complexity.complexity === 'medium' ? 0.6 : 0.9,
      tokenEfficiency: await this.calculateTokenEfficiency()
    };

    return {
      id: `step_${this.steps.length + 1}`,
      description,
      reasoning,
      tokens,
      status: 'active',
      timestamp: new Date().toISOString(),
      confidence: defaultConfidence,
      metrics
    };
  }

  /**
   * Add a step to the history
   */
  protected addStep(step: ThinkingStep): void {
    this.steps.push(step);
  }

  /**
   * Get all steps executed so far
   */
  getSteps(): ThinkingStep[] {
    return [...this.steps];
  }

  /**
   * Calculate token usage for a piece of text
   */
  protected calculateTokenUsage(text: string): number {
    return this.tokenOptimizer.estimateTokenCount(text);
  }

  /**
   * Analyze the remaining complexity of the problem
   */
  protected analyzeRemainingComplexity(): { 
    complexity: 'low' | 'medium' | 'high';
    estimatedSteps: number;
  } {
    const remainingSteps = this.estimateRemainingSteps();
    let complexity: 'low' | 'medium' | 'high';

    if (remainingSteps <= 2) {
      complexity = 'low';
    } else if (remainingSteps <= 5) {
      complexity = 'medium';
    } else {
      complexity = 'high';
    }

    return { complexity, estimatedSteps: remainingSteps };
  }

  /**
   * Check if the strategy is making good progress
   */
  protected isProgressingWell(): boolean {
    if (this.steps.length < 2) return true;

    // Check for token efficiency
    const recentSteps = this.steps.slice(-2);
    const avgTokens = recentSteps.reduce((sum, step) => sum + step.tokens, 0) / recentSteps.length;
    
    // Check progress rate
    const progressRate = this.getProgress() / this.steps.length;
    
    return avgTokens < 1000 && progressRate > 0.1;
  }

  /**
   * Estimate remaining steps needed
   */
  private estimateRemainingSteps(): number {
    if (this.steps.length === 0) return 10;

    const progressPerStep = this.getProgress() / this.steps.length;
    const remainingProgress = 1 - this.getProgress();
    
    return Math.ceil(remainingProgress / progressPerStep);
  }

  /**
   * Validate token usage for a piece of content
   */
  protected async validateTokenUsage(content: string): Promise<boolean> {
    const tokens = this.tokenOptimizer.estimateTokenCount(content);
    // If maxTokens is not defined, use a default value based on tokenLimit
    const maxTokens = this.model.maxTokens || this.getDefaultMaxTokens();
    return tokens <= maxTokens;
  }

  /**
   * Get default max tokens based on tokenLimit if maxTokens is not defined
   */
  private getDefaultMaxTokens(): number {
    if (!this.model.tokenLimit) return 1000; // Default value
    
    // Map tokenLimit string to actual token limits
    const tokenLimitMap: Record<string, number> = {
      'very_low': 500,
      'low': 1000,
      'moderate': 2000,
      'high': 4000,
      'very_high': 8000
    };
    
    return tokenLimitMap[this.model.tokenLimit] || 1000;
  }

  /**
   * Optimize content to fit within token limits
   */
  protected async optimizeContent(content: string): Promise<string> {
    if (await this.validateTokenUsage(content)) {
      return content;
    }
    // If maxTokens is not defined, use a default value based on tokenLimit
    const maxTokens = this.model.maxTokens || this.getDefaultMaxTokens();
    const result = this.tokenOptimizer.optimizeTokenUsage(content, {
      available_tokens: maxTokens
    });
    return result.optimized_prompt || content; // Return optimized content if available, otherwise original
  }

  /**
   * Get detailed metrics about the thinking process
   * Base implementation provides basic metrics
   */
  async getMetrics(): Promise<StrategyMetrics> {
    const progress = this.getProgress();
    const complexity = this.analyzeRemainingComplexity();
    const isProgressing = this.isProgressingWell();

    // Calculate base confidence from progress and complexity
    const baseConfidence = Math.min(
      (progress * 0.7) + (complexity.complexity === 'low' ? 0.3 :
                         complexity.complexity === 'medium' ? 0.2 : 0.1),
      0.95
    );

    return {
      confidence: baseConfidence,
      reasoning: await this.explainConfidence(),
      alternativePaths: [], // Base implementation doesn't track alternatives
      tokenEfficiency: await this.calculateTokenEfficiency(),
      complexityScore: complexity.complexity === 'low' ? 0.3 :
                      complexity.complexity === 'medium' ? 0.6 : 0.9
    };
  }

  /**
   * Generate alternative reasoning paths
   * Base implementation returns empty array
   */
  async generateAlternativePaths(count: number): Promise<AlternativePath[]> {
    return []; // Base implementation doesn't generate alternatives
  }

  /**
   * Calculate confidence score for current reasoning path
   * Base implementation uses progress and complexity
   */
  async calculateConfidence(): Promise<number> {
    const metrics = await this.getMetrics();
    return metrics.confidence;
  }

  /**
   * Get explanation for current confidence score
   * Base implementation provides simple explanation
   */
  async explainConfidence(): Promise<string> {
    const progress = this.getProgress();
    const complexity = this.analyzeRemainingComplexity();
    const isProgressing = this.isProgressingWell();

    return `Confidence Analysis:
Progress: ${(progress * 100).toFixed(1)}%
Remaining Complexity: ${complexity.complexity}
Estimated Steps Remaining: ${complexity.estimatedSteps}
Progress Rate: ${isProgressing ? 'Good' : 'Needs improvement'}
Token Efficiency: ${await this.calculateTokenEfficiency()}`;
  }

  /**
   * Compare current path with alternatives
   * Base implementation provides basic comparison
   */
  async compareAlternativePaths(): Promise<{
    differences: string[];
    tradeoffs: { [key: string]: string };
    recommendation: string;
  }> {
    return {
      differences: [],
      tradeoffs: {},
      recommendation: 'Using primary reasoning path as no alternatives are tracked in base implementation'
    };
  }

  /**
   * Calculate token efficiency metric
   * @protected
   */
  protected async calculateTokenEfficiency(): Promise<number> {
    if (this.steps.length === 0) return 1.0;

    const totalTokens = this.steps.reduce(
      (sum, step) => sum + (step.tokens || 0),
      0
    );
    
    const progress = this.getProgress();
    // Calculate efficiency as progress per 1000 tokens
    return progress / (totalTokens / 1000);
  }
}