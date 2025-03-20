/**
 * Depth-first thinking model strategy
 * Focuses on detailed analysis of critical components
 */
import { BaseThinkingStrategy } from './BaseThinkingStrategy.js';
export class DepthFirstStrategy extends BaseThinkingStrategy {
    currentStep = 0;
    problem = '';
    /**
     * Initialize the strategy with a problem
     */
    async initialize(problem) {
        this.problem = problem;
        this.currentStep = 0;
        this.steps = [];
        const baseTokens = 200; // Higher base tokens due to deeper analysis
        this.addStep(await this.createStep('Identify critical path components', 'Deep understanding of requirements reveals critical complexity points', baseTokens));
        this.addStep(await this.createStep('Deep analysis of critical components', 'Component analysis identifies areas requiring detailed investigation', baseTokens * 1.5));
        this.addStep(await this.createStep('Design solution for critical components', 'Create detailed solutions for the most challenging aspects first', baseTokens * 1.2));
        this.addStep(await this.createStep('Extend solution to remaining components', 'Apply insights from critical components to solve remaining parts', baseTokens));
        this.addStep(await this.createStep('Integrate and validate complete solution', 'Ensure all components work together seamlessly', baseTokens * 1.1));
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
        return 'depth_first';
    }
    /**
     * Generates a visualization of the thinking process
     */
    generateVisualization(steps) {
        return {
            type: 'tree',
            nodes: steps.map(step => ({
                id: step.id,
                label: step.description,
                status: step.status,
                details: step.reasoning,
                depth: this.calculateStepDepth(step)
            })),
            edges: this.generateDepthFirstEdges(steps),
            layout: {
                type: 'hierarchical',
                direction: 'TB',
                levelSeparation: 150,
                nodeSpacing: 180,
                treeSpacing: 200
            }
        };
    }
    /**
     * Calculate the depth level of a step
     * @private
     */
    calculateStepDepth(step) {
        if (step.description.includes('critical')) {
            return 3; // Critical path steps are deepest
        }
        else if (step.description.includes('analysis') || step.description.includes('design')) {
            return 2; // Analysis and design steps are medium depth
        }
        return 1; // Other steps are shallow
    }
    /**
     * Generates edges for a depth-first visualization
     * @private
     */
    generateDepthFirstEdges(steps) {
        const edges = [];
        // Connect critical steps with strong relationships
        const criticalSteps = steps.filter(step => step.description.includes('critical') ||
            step.description.includes('Deep analysis'));
        // Connect critical steps
        for (let i = 0; i < criticalSteps.length - 1; i++) {
            edges.push({
                source: criticalSteps[i].id,
                target: criticalSteps[i + 1].id,
                label: 'critical_path'
            });
        }
        // Connect remaining steps
        for (let i = 0; i < steps.length - 1; i++) {
            if (!edges.some(edge => edge.source === steps[i].id &&
                edge.target === steps[i + 1].id)) {
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
//# sourceMappingURL=DepthFirstStrategy.js.map