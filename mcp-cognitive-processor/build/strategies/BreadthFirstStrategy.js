/**
 * Breadth-first thinking model strategy
 * Focuses on exploring multiple solutions simultaneously
 */
import { BaseThinkingStrategy } from './BaseThinkingStrategy.js';
export class BreadthFirstStrategy extends BaseThinkingStrategy {
    currentStep = 0;
    problem = '';
    /**
     * Initialize the strategy with a problem
     */
    async initialize(problem) {
        this.problem = problem;
        this.currentStep = 0;
        this.steps = [];
        // Initialize with standard steps
        const baseTokens = 150; // Base token count per step
        this.addStep(await this.createStep('Generate multiple solution candidates', 'Understanding requirements guides exploration of multiple solution paths', baseTokens));
        this.addStep(await this.createStep('Evaluate solution candidates', 'Component analysis enables parallel exploration of alternative approaches', baseTokens));
        this.addStep(await this.createStep('Compare solution trade-offs', 'Analysis of pros and cons for each viable solution', baseTokens));
        this.addStep(await this.createStep('Select optimal solution', 'Choose the most appropriate solution based on evaluation criteria', baseTokens));
        this.addStep(await this.createStep('Implement selected solution', 'Execute the chosen solution with insights from alternatives', baseTokens));
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
        return 'breadth_first';
    }
    /**
     * Generates a visualization of the thinking process
     */
    generateVisualization(steps) {
        return {
            type: 'network',
            nodes: steps.map(step => ({
                id: step.id,
                label: step.description,
                status: step.status,
                details: step.reasoning
            })),
            edges: this.generateBreadthFirstEdges(steps),
            layout: {
                type: 'force',
                springLength: 200,
                springConstant: 0.05,
                dragCoeff: 0.02,
                gravity: -1.2
            }
        };
    }
    /**
     * Generates edges for a breadth-first visualization
     * @private
     */
    generateBreadthFirstEdges(steps) {
        const edges = [];
        // Connect each evaluation step to implementation steps
        const evalSteps = steps.filter(step => step.description.includes('Evaluate') ||
            step.description.includes('Compare'));
        const implSteps = steps.filter(step => step.description.includes('Implement') ||
            step.description.includes('Select'));
        if (evalSteps.length > 0 && implSteps.length > 0) {
            implSteps.forEach(implStep => {
                evalSteps.forEach(evalStep => {
                    edges.push({
                        source: evalStep.id,
                        target: implStep.id,
                        label: 'informs'
                    });
                });
            });
        }
        // Add remaining connections to make the graph connected
        for (let i = 0; i < steps.length - 1; i++) {
            if (!edges.some(edge => edge.source === steps[i].id || edge.target === steps[i].id)) {
                edges.push({
                    source: steps[i].id,
                    target: steps[i + 1].id,
                    label: 'next'
                });
            }
        }
        return edges;
    }
}
//# sourceMappingURL=BreadthFirstStrategy.js.map