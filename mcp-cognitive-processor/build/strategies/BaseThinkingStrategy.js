/**
 * Base abstract class for thinking strategies
 * Provides common functionality and required interface for all thinking strategies
 */
export class BaseThinkingStrategy {
    steps = [];
    model;
    tokenOptimizer;
    constructor(model, tokenOptimizer) {
        this.model = model;
        this.tokenOptimizer = tokenOptimizer;
    }
    /**
     * Get the thinking model configuration
     */
    getModel() {
        return this.model;
    }
    /**
     * Create a new thinking step
     */
    async createStep(description, reasoning, tokens) {
        // Calculate default confidence based on progress and complexity
        const complexity = this.analyzeRemainingComplexity();
        const progress = this.getProgress();
        const defaultConfidence = Math.min((progress * 0.7) + (complexity.complexity === 'low' ? 0.3 :
            complexity.complexity === 'medium' ? 0.2 : 0.1), 0.95);
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
    addStep(step) {
        this.steps.push(step);
    }
    /**
     * Get all steps executed so far
     */
    getSteps() {
        return [...this.steps];
    }
    /**
     * Calculate token usage for a piece of text
     */
    calculateTokenUsage(text) {
        return this.tokenOptimizer.estimateTokenCount(text);
    }
    /**
     * Analyze the remaining complexity of the problem
     */
    analyzeRemainingComplexity() {
        const remainingSteps = this.estimateRemainingSteps();
        let complexity;
        if (remainingSteps <= 2) {
            complexity = 'low';
        }
        else if (remainingSteps <= 5) {
            complexity = 'medium';
        }
        else {
            complexity = 'high';
        }
        return { complexity, estimatedSteps: remainingSteps };
    }
    /**
     * Check if the strategy is making good progress
     */
    isProgressingWell() {
        if (this.steps.length < 2)
            return true;
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
    estimateRemainingSteps() {
        if (this.steps.length === 0)
            return 10;
        const progressPerStep = this.getProgress() / this.steps.length;
        const remainingProgress = 1 - this.getProgress();
        return Math.ceil(remainingProgress / progressPerStep);
    }
    /**
     * Validate token usage for a piece of content
     */
    async validateTokenUsage(content) {
        const tokens = this.tokenOptimizer.estimateTokenCount(content);
        // If maxTokens is not defined, use a default value based on tokenLimit
        const maxTokens = this.model.maxTokens || this.getDefaultMaxTokens();
        return tokens <= maxTokens;
    }
    /**
     * Get default max tokens based on tokenLimit if maxTokens is not defined
     */
    getDefaultMaxTokens() {
        if (!this.model.tokenLimit)
            return 1000; // Default value
        // Map tokenLimit string to actual token limits
        const tokenLimitMap = {
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
    async optimizeContent(content) {
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
    async getMetrics() {
        const progress = this.getProgress();
        const complexity = this.analyzeRemainingComplexity();
        const isProgressing = this.isProgressingWell();
        // Calculate base confidence from progress and complexity
        const baseConfidence = Math.min((progress * 0.7) + (complexity.complexity === 'low' ? 0.3 :
            complexity.complexity === 'medium' ? 0.2 : 0.1), 0.95);
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
    async generateAlternativePaths(count) {
        return []; // Base implementation doesn't generate alternatives
    }
    /**
     * Calculate confidence score for current reasoning path
     * Base implementation uses progress and complexity
     */
    async calculateConfidence() {
        const metrics = await this.getMetrics();
        return metrics.confidence;
    }
    /**
     * Get explanation for current confidence score
     * Base implementation provides simple explanation
     */
    async explainConfidence() {
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
    async compareAlternativePaths() {
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
    async calculateTokenEfficiency() {
        if (this.steps.length === 0)
            return 1.0;
        const totalTokens = this.steps.reduce((sum, step) => sum + (step.tokens || 0), 0);
        const progress = this.getProgress();
        // Calculate efficiency as progress per 1000 tokens
        return progress / (totalTokens / 1000);
    }
}
//# sourceMappingURL=BaseThinkingStrategy.js.map