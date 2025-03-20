/**
 * CompositeStrategy
 * Combines multiple thinking strategies to leverage their strengths
 * Implements the composite design pattern for strategy composition
 */
import { BaseThinkingStrategy } from './BaseThinkingStrategy.js';
/**
 * CompositeStrategy combines multiple thinking strategies into a unified approach
 * It can operate in different modes: sequential, parallel, or weighted
 */
export class CompositeStrategy extends BaseThinkingStrategy {
    strategies = [];
    mode = 'sequential';
    problemContext = '';
    feedbackEnabled = true;
    strategyPerformance = new Map();
    currentConfidence = 0.5;
    confidenceReasoning = '';
    alternativePaths = [];
    constructor(model, tokenOptimizer, strategies = [], mode = 'sequential') {
        super(model, tokenOptimizer);
        // Register all strategies with default equal weights
        strategies.forEach(strategy => {
            this.addStrategy(strategy, 1.0);
        });
        this.mode = mode;
        this.feedbackEnabled = process.env.STRATEGY_FEEDBACK_ENABLED === 'true';
    }
    /**
     * Add a strategy to the composite with a specific weight
     */
    addStrategy(strategy, weight = 1.0) {
        // Generate a unique name if the strategy doesn't have one
        const strategyName = strategy.constructor.name || `Strategy_${this.strategies.length}`;
        this.strategies.push({
            strategy,
            weight,
            name: strategyName
        });
        // Initialize tracking for this strategy if feedback is enabled
        if (this.feedbackEnabled && !this.strategyPerformance.has(strategyName)) {
            this.strategyPerformance.set(strategyName, {
                successRate: 0.5, // Initial neutral rating
                avgStepQuality: 0.5,
                usageCount: 0
            });
        }
    }
    /**
     * Initialize all strategies with the problem
     * @param problem The problem to solve
     */
    async initialize(problem) {
        this.problemContext = problem;
        console.log(`Initializing CompositeStrategy with ${this.strategies.length} strategies in ${this.mode} mode`);
        // Initialize all strategies
        const initPromises = this.strategies.map(({ strategy }) => strategy.initialize(problem));
        if (this.mode === 'parallel') {
            // Initialize all strategies in parallel
            await Promise.all(initPromises);
        }
        else {
            // Initialize strategies sequentially
            for (const promise of initPromises) {
                await promise;
            }
        }
        // Reset steps
        this.steps = [];
    }
    /**
     * Execute the next step in the thinking process
     * @returns The completed thinking step with confidence score
     */
    async executeNextStep() {
        const step = await this.nextStep();
        if (!step) {
            // If no strategy can produce a step, create a simple completion step
            return {
                id: `conclusion-${Date.now()}`,
                description: 'Conclusion',
                reasoning: 'Composite strategy has reached a conclusion.',
                tokens: 0,
                status: 'completed',
                timestamp: new Date().toISOString(),
                confidence: this.currentConfidence
            };
        }
        return step;
    }
    /**
     * Generate the next thinking step by combining multiple strategies
     * Internal implementation - not part of the public interface
     */
    async nextStep() {
        if (this.strategies.length === 0) {
            console.warn('CompositeStrategy has no strategies registered');
            return null;
        }
        switch (this.mode) {
            case 'sequential':
                return this.sequentialNextStep();
            case 'parallel':
                return this.parallelNextStep();
            case 'weighted':
                return this.weightedNextStep();
            default:
                return this.sequentialNextStep();
        }
    }
    /**
     * Sequential mode: Use strategies one after another
     */
    async sequentialNextStep() {
        // Find first strategy that can produce a next step
        for (const { strategy, name } of this.strategies) {
            try {
                const step = await strategy.executeNextStep();
                if (step) {
                    step.metadata = { ...(step.metadata || {}), sourceStrategy: name };
                    this.steps.push(step);
                    // Update strategy performance if feedback is enabled
                    if (this.feedbackEnabled) {
                        this.updateStrategyPerformance(name, step);
                    }
                    return step;
                }
            }
            catch (error) {
                console.error(`Error getting next step from strategy ${name}:`, error);
            }
        }
        return null;
    }
    /**
     * Parallel mode: Get suggestions from all strategies and choose the best one
     */
    async parallelNextStep() {
        // Collect next steps from all strategies in parallel
        const stepPromises = this.strategies.map(async ({ strategy, name }) => {
            try {
                const step = await strategy.executeNextStep();
                return { step, name };
            }
            catch (error) {
                console.error(`Error getting next step from strategy ${name}:`, error);
                return null;
            }
        });
        const results = await Promise.all(stepPromises);
        const validResults = results.filter(result => result !== null);
        if (validResults.length === 0) {
            return null;
        }
        // Select the best step based on confidence or quality heuristics
        // For now, just use the first valid result
        const selected = this.selectBestStep(validResults);
        if (selected) {
            selected.step.metadata = { ...(selected.step.metadata || {}), sourceStrategy: selected.name };
            this.steps.push(selected.step);
            // Update performance metrics
            if (this.feedbackEnabled) {
                this.updateStrategyPerformance(selected.name, selected.step);
            }
            return selected.step;
        }
        return null;
    }
    /**
     * Weighted mode: Use strategy weights to determine which one to use
     */
    async weightedNextStep() {
        // Calculate total weight
        const totalWeight = this.strategies.reduce((sum, { weight }) => sum + weight, 0);
        // If feedback is enabled, adjust weights based on past performance
        const adjustedStrategies = [...this.strategies];
        if (this.feedbackEnabled) {
            adjustedStrategies.forEach(strat => {
                const performance = this.strategyPerformance.get(strat.name);
                if (performance) {
                    strat.weight *= (0.5 + performance.successRate * 0.5); // Adjust weight by success rate
                }
            });
        }
        // Normalize weights
        const normalizedWeights = adjustedStrategies.map(strat => ({
            ...strat,
            normalizedWeight: strat.weight / totalWeight
        }));
        // Select strategy based on weights
        const random = Math.random();
        let cumulativeWeight = 0;
        let selectedStrategy = null;
        for (const strat of normalizedWeights) {
            cumulativeWeight += strat.normalizedWeight;
            if (random <= cumulativeWeight) {
                selectedStrategy = strat;
                break;
            }
        }
        // Fallback to first strategy if none selected (shouldn't happen with proper normalization)
        if (!selectedStrategy && normalizedWeights.length > 0) {
            selectedStrategy = normalizedWeights[0];
        }
        if (selectedStrategy) {
            const step = await selectedStrategy.strategy.executeNextStep();
            if (step) {
                step.metadata = { ...(step.metadata || {}), sourceStrategy: selectedStrategy.name };
                this.steps.push(step);
                // Update performance
                if (this.feedbackEnabled) {
                    this.updateStrategyPerformance(selectedStrategy.name, step);
                }
                return step;
            }
        }
        return null;
    }
    /**
     * Select the best step from multiple candidates
     */
    selectBestStep(candidates) {
        if (candidates.length === 0)
            return null;
        if (candidates.length === 1)
            return candidates[0];
        // If step has confidence score, use that
        const withConfidence = candidates.filter(c => c.step.metadata && typeof c.step.metadata.confidence === 'number');
        if (withConfidence.length > 0) {
            return withConfidence.reduce((best, current) => {
                const currentConfidence = current.step.metadata?.confidence;
                const bestConfidence = best.step.metadata?.confidence;
                return currentConfidence > bestConfidence ? current : best;
            }, withConfidence[0]);
        }
        // Otherwise, use strategy with highest success rate
        if (this.feedbackEnabled) {
            return candidates.reduce((best, current) => {
                const currentPerf = this.strategyPerformance.get(current.name);
                const bestPerf = this.strategyPerformance.get(best.name);
                if (!currentPerf)
                    return best;
                if (!bestPerf)
                    return current;
                return currentPerf.successRate > bestPerf.successRate ? current : best;
            }, candidates[0]);
        }
        // Default to first candidate
        return candidates[0];
    }
    /**
     * Update strategy performance metrics
     */
    updateStrategyPerformance(strategyName, step) {
        if (!this.feedbackEnabled)
            return;
        const performance = this.strategyPerformance.get(strategyName);
        if (!performance)
            return;
        // Calculate step quality heuristic (0-1)
        let stepQuality = 0.5; // Default neutral quality
        // Use confidence if available
        if (step.metadata && typeof step.metadata.confidence === 'number') {
            stepQuality = step.metadata.confidence;
        }
        // Otherwise use length and complexity heuristics
        else if (step.reasoning) {
            // Longer reasoning up to a point is usually better
            const lengthScore = Math.min(step.reasoning.length / 1000, 1) * 0.5;
            // More structured reasoning is usually better
            const hasStructure = /^\d+\.|^\*|^-|^•/.test(step.reasoning);
            const structureScore = hasStructure ? 0.3 : 0;
            // Concrete examples are better
            const hasExamples = step.reasoning.includes('example') ||
                step.reasoning.includes('instance') ||
                step.reasoning.includes('specifically');
            const exampleScore = hasExamples ? 0.2 : 0;
            stepQuality = lengthScore + structureScore + exampleScore;
        }
        // Update the performance metrics
        performance.usageCount += 1;
        const weight = Math.min(performance.usageCount, 10) / 10; // More weight to new data as we get more samples
        // Update success rate - simple heuristic for now
        performance.successRate = (performance.successRate * (1 - weight)) + (stepQuality * weight);
        // Update average step quality
        performance.avgStepQuality = (performance.avgStepQuality * (performance.usageCount - 1) + stepQuality) / performance.usageCount;
        // Update the map
        this.strategyPerformance.set(strategyName, performance);
    }
    /**
     * Check if the thinking process should continue
     * @returns True if more steps are needed, false if complete
     */
    shouldContinue() {
        // Check if any component strategy should continue
        for (const { strategy } of this.strategies) {
            if (strategy.shouldContinue()) {
                return true;
            }
        }
        return false;
    }
    /**
     * Get the current progress of the thinking process
     * @returns Progress as a percentage (0-100)
     */
    getProgress() {
        // Average progress across all strategies
        const totalProgress = this.strategies.reduce((sum, { strategy }) => sum + strategy.getProgress(), 0);
        return this.strategies.length > 0 ? totalProgress / this.strategies.length : 100;
    }
    /**
     * Generate a visualization of the thinking process
     * @returns A visualization of the thinking process
     */
    /**
     * Generate visualization for the thinking process
     * @param steps Optional array of thinking steps to visualize
     * @returns Visualization of the thinking process
     */
    generateVisualization(steps) {
        const stepsToVisualize = steps || this.steps;
        // Create nodes for each step
        const nodes = stepsToVisualize.map((step, index) => {
            // Extract the source strategy if available
            const metadata = step.metadata || {};
            const sourceStrategy = metadata.sourceStrategy || 'unknown';
            return {
                id: step.id || `step_${index + 1}`,
                label: step.description || `Step ${index + 1}`,
                status: step.status || 'completed',
                details: step.reasoning || `Step reasoning for ${index + 1}. Source: ${sourceStrategy}`
            };
        });
        // Create edges between steps
        const edges = nodes.slice(1).map((node, index) => ({
            source: nodes[index].id,
            target: node.id,
            label: ''
        }));
        // Create a visualization format that shows the composite nature
        return {
            type: 'network', // Using a supported visualization type
            nodes,
            edges,
            layout: {
                type: 'hierarchical',
                direction: 'LR',
                levelSeparation: 150,
                nodeSpacing: 100
            },
            processId: `composite_${this.mode}_${Date.now()}`
        };
    }
    /**
     * Get detailed metrics about the thinking process
     * @returns Strategy metrics including confidence and alternative paths
     */
    async getMetrics() {
        // Calculate current confidence if not already done
        if (this.currentConfidence === 0.5) {
            this.currentConfidence = await this.calculateConfidence();
        }
        return {
            confidence: this.currentConfidence,
            reasoning: this.confidenceReasoning,
            alternativePaths: this.alternativePaths,
            tokenEfficiency: await this.calculateTokenEfficiency(),
            complexityScore: this.calculateComplexityScore()
        };
    }
    /**
     * Generate alternative reasoning paths
     * @param count Number of alternative paths to generate
     * @returns Array of alternative reasoning paths
     */
    async generateAlternativePaths(count) {
        // Get alternative paths from all strategies
        const allPaths = [];
        for (const { strategy } of this.strategies) {
            try {
                const paths = await strategy.generateAlternativePaths(Math.ceil(count / this.strategies.length));
                allPaths.push(...paths);
            }
            catch (error) {
                console.error('Error generating alternative paths:', error);
            }
        }
        // Sort by confidence and take top 'count' paths
        const sortedPaths = allPaths.sort((a, b) => b.confidence - a.confidence);
        this.alternativePaths = sortedPaths.slice(0, count);
        return this.alternativePaths;
    }
    /**
     * Calculate confidence score for current reasoning path
     * @returns Confidence score between 0 and 1
     */
    async calculateConfidence() {
        // Get confidence from all strategies
        const confidences = [];
        for (const { strategy, weight } of this.strategies) {
            try {
                const confidence = await strategy.calculateConfidence();
                confidences.push(confidence * weight);
            }
            catch (error) {
                console.error('Error calculating confidence:', error);
            }
        }
        // Calculate weighted average
        const totalWeight = this.strategies.reduce((sum, { weight }) => sum + weight, 0);
        this.currentConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / totalWeight;
        return this.currentConfidence;
    }
    /**
     * Get explanation for current confidence score
     * @returns Detailed explanation of confidence calculation
     */
    async explainConfidence() {
        // Combine explanations from all strategies
        const explanations = [];
        for (const { strategy, name, weight } of this.strategies) {
            try {
                const explanation = await strategy.explainConfidence();
                explanations.push(`${name} (weight: ${weight.toFixed(2)}): ${explanation}`);
            }
            catch (error) {
                console.error('Error explaining confidence:', error);
            }
        }
        // Combine explanations
        this.confidenceReasoning =
            `Composite confidence explanation (${this.currentConfidence.toFixed(2)}):\n` +
                explanations.join('\n');
        return this.confidenceReasoning;
    }
    /**
     * Compare current path with alternatives
     * @returns Analysis of path differences and trade-offs
     */
    async compareAlternativePaths() {
        // Get comparisons from all strategies
        const comparisons = await Promise.all(this.strategies.map(async ({ strategy }) => {
            try {
                return await strategy.compareAlternativePaths();
            }
            catch (error) {
                console.error('Error comparing alternative paths:', error);
                return null;
            }
        }));
        // Combine differences and tradeoffs
        const allDifferences = [];
        const allTradeoffs = {};
        const recommendations = [];
        for (const comparison of comparisons) {
            if (comparison) {
                allDifferences.push(...comparison.differences);
                Object.assign(allTradeoffs, comparison.tradeoffs);
                recommendations.push(comparison.recommendation);
            }
        }
        // Create combined recommendation
        const recommendation = recommendations.length > 0
            ? recommendations.join('\n')
            : 'No specific recommendations from component strategies.';
        return {
            differences: [...new Set(allDifferences)],
            tradeoffs: allTradeoffs,
            recommendation
        };
    }
    /**
     * Calculate token efficiency score
     * Override the token efficiency calculation to use composite strategy logic
     * @returns Promise with token efficiency score between 0 and 1
     */
    async calculateTokenEfficiency() {
        // Average token efficiency across all steps
        if (this.steps.length === 0)
            return 1.0;
        // Calculate how many tokens were used vs. how complex the reasoning is
        const totalTokens = this.steps.reduce((sum, step) => sum + (step.tokens || 0), 0);
        const averageReasoning = this.steps.reduce((sum, step) => sum + (step.reasoning ? step.reasoning.length : 0), 0) / this.steps.length;
        // Simple heuristic: longer reasoning with fewer tokens is more efficient
        return Math.min(1.0, averageReasoning / (totalTokens || 1) * 0.1);
    }
    /**
     * Calculate complexity score for the thinking process
     * @returns Complexity score between 0 and 1
     */
    calculateComplexityScore() {
        // Estimate complexity based on number of strategies and steps
        const strategyComplexity = this.strategies.length / 5; // Normalize to 0-1
        const stepComplexity = Math.min(1.0, this.steps.length / 10); // Normalize to 0-1
        return (strategyComplexity + stepComplexity) / 2;
    }
    /**
     * Get current strategy performance metrics
     * Internal helper method
     */
    getStrategyMetricsInternal() {
        const metrics = {
            strategyName: 'CompositeStrategy',
            strategyType: this.mode,
            stepCount: this.steps.length,
            averageStepTokens: this.calculateAverageTokens(),
            componentStrategies: []
        };
        if (this.feedbackEnabled) {
            metrics.componentStrategies = Array.from(this.strategyPerformance.entries()).map(([name, perf]) => ({
                name,
                successRate: perf.successRate,
                averageQuality: perf.avgStepQuality,
                usageCount: perf.usageCount
            }));
        }
        return metrics;
    }
    /**
     * Calculate average tokens across steps
     */
    calculateAverageTokens() {
        if (this.steps.length === 0)
            return 0;
        const totalTokens = this.steps.reduce((sum, step) => sum + (step.tokens || 0), 0);
        return totalTokens / this.steps.length;
    }
    /**
     * Get all thinking steps
     */
    getSteps() {
        return this.steps;
    }
    /**
     * Get alternative paths that were considered
     * Internal helper method that aggregates paths from component strategies
     */
    async getAlternativePathsInternal() {
        // Collect alternative paths from all component strategies
        const allPaths = [];
        for (const { strategy, name } of this.strategies) {
            try {
                const paths = await strategy.generateAlternativePaths(3); // Get up to 3 paths from each strategy
                // Add paths without trying to modify them with metadata
                allPaths.push(...paths);
            }
            catch (error) {
                console.error(`Error getting alternative paths from ${name}:`, error);
            }
        }
        return allPaths;
    }
    /**
     * Generate thinking visualizations
     * Internal helper method that creates visualizations
     */
    async visualize() {
        // Create visualizations for the composite strategy
        const allVisualizations = [];
        // Add our own visualization of the composite strategy
        allVisualizations.push(this.generateVisualization());
        // Add a composite visualization showing strategy contributions
        if (this.feedbackEnabled && this.steps.length > 0) {
            const strategyContributions = new Map();
            // Count steps from each strategy
            for (const step of this.steps) {
                const stepWithMeta = step;
                if (stepWithMeta.metadata && stepWithMeta.metadata.sourceStrategy) {
                    const source = stepWithMeta.metadata.sourceStrategy;
                    strategyContributions.set(source, (strategyContributions.get(source) || 0) + 1);
                }
            }
            // Create contribution visualization
            const nodes = Array.from(strategyContributions.entries()).map(([stratName, count], index) => ({
                id: `strat_${index}`,
                label: `${stratName} (${count} steps)`,
                status: 'completed'
            }));
            const edges = nodes.map(node => ({
                source: 'composite',
                target: node.id,
                label: ''
            }));
            // Add central node
            nodes.push({
                id: 'composite',
                label: 'CompositeStrategy',
                status: 'completed'
            });
            allVisualizations.push({
                type: 'network',
                processId: `contributions_${Date.now()}`,
                nodes,
                edges
            });
        }
        return allVisualizations;
    }
}
//# sourceMappingURL=CompositeStrategy.js.map