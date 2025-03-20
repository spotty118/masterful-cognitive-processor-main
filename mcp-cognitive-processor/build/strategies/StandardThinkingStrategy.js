/**
 * Standard thinking model strategy
 * Provides a balanced thinking approach with moderate detail
 */
import { BaseThinkingStrategy } from './BaseThinkingStrategy.js';
export class StandardThinkingStrategy extends BaseThinkingStrategy {
    currentStep = 0;
    problem = '';
    /**
     * Initialize the strategy with a problem
     */
    async initialize(problem) {
        this.problem = problem;
        this.currentStep = 0;
        this.steps = [];
        // Base token count for standard steps
        const baseTokens = 150;
        this.addStep(await this.createStep('Analyze problem requirements', 'Understanding the core requirements is essential before proceeding with solution design', baseTokens));
        this.addStep(await this.createStep('Identify key components and relationships', 'Breaking down the problem into components helps manage complexity and identify dependencies', baseTokens * 1.2));
        this.addStep(await this.createStep('Evaluate potential solution approaches', 'Considering multiple approaches ensures we select the most appropriate solution strategy', baseTokens * 1.3));
        this.addStep(await this.createStep('Design solution architecture', 'Creating a well-structured solution architecture based on the chosen approach', baseTokens * 1.4));
        this.addStep(await this.createStep('Implement solution with detailed steps', 'Converting the architecture into concrete implementation steps', baseTokens * 1.5));
    }
    /**
     * Execute the next thinking step
     */
    async executeNextStep() {
        if (!this.shouldContinue()) {
            throw new Error('No more steps to execute');
        }
        const step = this.steps[this.currentStep];
        step.status = 'completed';
        this.currentStep++;
        if (this.currentStep < this.steps.length) {
            this.steps[this.currentStep].status = 'active';
        }
        return step;
    }
    /**
     * Determine if the strategy should continue executing steps
     */
    shouldContinue() {
        return this.currentStep < this.steps.length;
    }
    /**
     * Get the current progress (0-1)
     */
    getProgress() {
        return this.currentStep / this.steps.length;
    }
    /**
     * Gets the name of the thinking model
     */
    getName() {
        return 'standard';
    }
    /**
     * Generates a visualization of the thinking process
     */
    generateVisualization(steps) {
        return {
            type: 'linear',
            nodes: steps.map(step => ({
                id: step.id,
                label: step.description,
                status: step.status,
                details: step.reasoning
            })),
            edges: this.generateLinearEdges(steps),
            layout: {
                type: 'hierarchical',
                direction: 'LR',
                levelSeparation: 100,
                nodeSpacing: 50
            }
        };
    }
    /**
     * Generates edges for a linear visualization
     * @private
     */
    generateLinearEdges(steps) {
        const edges = [];
        // Create linear connections between steps
        for (let i = 0; i < steps.length - 1; i++) {
            edges.push({
                source: steps[i].id,
                target: steps[i + 1].id,
                label: 'next'
            });
        }
        return edges;
    }
}
//# sourceMappingURL=StandardThinkingStrategy.js.map