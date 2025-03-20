/**
 * Chain of Thought thinking strategy implementation
 * Implements a sequential reasoning process that builds each step upon previous conclusions
 */
import { BaseThinkingStrategy } from './BaseThinkingStrategy.js';
export class ChainOfThoughtStrategy extends BaseThinkingStrategy {
    problem = '';
    currentStep = 0;
    maxSteps = 7;
    completed = false;
    intermediateThoughts = [];
    conclusion = '';
    constructor(model, tokenOptimizer) {
        super(model, tokenOptimizer);
    }
    async initialize(problem) {
        this.problem = await this.optimizeContent(problem);
        this.currentStep = 0;
        this.completed = false;
        this.steps = [];
        this.intermediateThoughts = [];
        this.conclusion = '';
        // Determine the number of steps based on problem complexity
        const problemTokens = this.calculateTokenUsage(problem);
        if (problemTokens < 100) {
            this.maxSteps = 4;
        }
        else if (problemTokens < 300) {
            this.maxSteps = 6;
        }
        else {
            this.maxSteps = 8;
        }
    }
    async executeNextStep() {
        let step;
        if (this.currentStep < this.maxSteps - 1) {
            // Regular intermediate step
            step = await this.executeIntermediateStep();
        }
        else {
            // Final conclusion step
            step = await this.executeConclusionStep();
            this.completed = true;
        }
        this.addStep(step);
        this.currentStep++;
        return step;
    }
    shouldContinue() {
        return !this.completed;
    }
    getProgress() {
        return (this.currentStep + 1) / this.maxSteps;
    }
    generateVisualization(steps) {
        // Create a linear chain visualization of the thinking process
        const nodes = steps.map((step, index) => ({
            id: step.id,
            label: step.description,
            status: step.status,
            details: step.reasoning,
            depth: index
        }));
        const edges = nodes.slice(1).map((node, index) => ({
            source: nodes[index].id,
            target: node.id,
            label: `Thought ${index + 1} → ${index + 2}`
        }));
        return {
            type: 'linear',
            nodes,
            edges,
            layout: {
                type: 'hierarchical',
                direction: 'TB',
                levelSeparation: 100,
                nodeSpacing: 150
            }
        };
    }
    async executeIntermediateStep() {
        const stepNumber = this.currentStep + 1;
        const previousThoughts = this.intermediateThoughts.join("\n\n");
        // Create a description based on the current step number
        let description = '';
        if (stepNumber === 1) {
            description = 'Initial understanding of the problem';
        }
        else if (stepNumber === 2) {
            description = 'Developing initial chain of reasoning';
        }
        else {
            description = `Continuing the chain of thought (step ${stepNumber})`;
        }
        // Create reasoning content based on previous thoughts and current progress
        let reasoning = '';
        if (stepNumber === 1) {
            reasoning = `Examining the problem: "${this.problem}"`;
        }
        else {
            reasoning = `Building on previous thoughts:\n${previousThoughts}\n\nContinuing the chain of reasoning...`;
        }
        // Calculate token usage for the step
        const tokens = this.calculateTokenUsage(description + reasoning);
        // Create and store the intermediate thought
        const thought = `Thought ${stepNumber}: ${description}`;
        this.intermediateThoughts.push(thought);
        return this.createStep(description, reasoning, tokens);
    }
    async executeConclusionStep() {
        const description = 'Forming final conclusion based on chain of thought';
        const reasoning = `After considering the following chain of thoughts:\n${this.intermediateThoughts.join("\n")}\n\nI can now reach a conclusion about the problem.`;
        const tokens = this.calculateTokenUsage(description + reasoning);
        this.conclusion = 'The chain of thought reasoning has led to a comprehensive solution.';
        return this.createStep(description, reasoning, tokens);
    }
}
//# sourceMappingURL=ChainOfThoughtStrategy.js.map