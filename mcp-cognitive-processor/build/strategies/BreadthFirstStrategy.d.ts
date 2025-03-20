/**
 * Breadth-first thinking model strategy
 * Focuses on exploring multiple solutions simultaneously
 */
import { BaseThinkingStrategy } from './BaseThinkingStrategy.js';
import { ThinkingStep, ThinkingVisualization } from '../models/types.js';
export declare class BreadthFirstStrategy extends BaseThinkingStrategy {
    private currentStep;
    private problem;
    /**
     * Initialize the strategy with a problem
     */
    initialize(problem: string): Promise<void>;
    /**
     * Execute the next thinking step
     */
    executeNextStep(): Promise<ThinkingStep>;
    /**
     * Determine if the strategy should continue executing steps
     */
    shouldContinue(): boolean;
    /**
     * Get the current progress (0-1)
     */
    getProgress(): number;
    /**
     * Gets the name of the thinking model
     */
    getName(): string;
    /**
     * Generates a visualization of the thinking process
     */
    generateVisualization(steps: ThinkingStep[]): ThinkingVisualization;
    /**
     * Generates edges for a breadth-first visualization
     * @private
     */
    private generateBreadthFirstEdges;
}
