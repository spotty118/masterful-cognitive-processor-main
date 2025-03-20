/**
 * Chain of Thought thinking strategy implementation
 * Implements a sequential reasoning process that builds each step upon previous conclusions
 */
import { ThinkingStep, ThinkingModel, ThinkingVisualization } from '../models/types.js';
import { ITokenOptimizer } from '../interfaces/ITokenOptimizer.js';
import { BaseThinkingStrategy } from './BaseThinkingStrategy.js';
export declare class ChainOfThoughtStrategy extends BaseThinkingStrategy {
    private problem;
    private currentStep;
    private maxSteps;
    private completed;
    private intermediateThoughts;
    private conclusion;
    constructor(model: ThinkingModel, tokenOptimizer: ITokenOptimizer);
    initialize(problem: string): Promise<void>;
    executeNextStep(): Promise<ThinkingStep>;
    shouldContinue(): boolean;
    getProgress(): number;
    generateVisualization(steps: ThinkingStep[]): ThinkingVisualization;
    private executeIntermediateStep;
    private executeConclusionStep;
}
