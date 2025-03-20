/**
 * Expanded step-by-step thinking model strategy
 * Provides a comprehensive thinking approach with detailed steps
 */
import { BaseThinkingStrategy } from './BaseThinkingStrategy.js';
import { ThinkingStep, ThinkingVisualization } from '../models/types.js';
export declare class ExpandedStepByStepStrategy extends BaseThinkingStrategy {
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
     * Calculate the depth level of a step
     * @private
     */
    private calculateStepDepth;
    /**
     * Generates edges for the expanded visualization
     * @private
     */
    private generateExpandedEdges;
    /**
     * Group steps by their phase for visualization
     * @private
     */
    private groupStepsByPhase;
}
