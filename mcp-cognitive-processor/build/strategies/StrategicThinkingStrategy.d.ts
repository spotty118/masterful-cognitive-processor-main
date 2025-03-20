/**
 * Strategic thinking strategy implementation
 * Implements a step-by-step approach to problem solving with strategic planning
 */
import { ThinkingStep, ThinkingModel, ThinkingVisualization } from '../models/types.js';
import { ITokenOptimizer } from '../interfaces/ITokenOptimizer.js';
import { BaseThinkingStrategy } from './BaseThinkingStrategy.js';
export declare class StrategicThinkingStrategy extends BaseThinkingStrategy {
    private problem;
    private currentPhase;
    private phases;
    private completed;
    constructor(model: ThinkingModel, tokenOptimizer: ITokenOptimizer);
    initialize(problem: string): Promise<void>;
    executeNextStep(): Promise<ThinkingStep>;
    shouldContinue(): boolean;
    getProgress(): number;
    generateVisualization(steps: ThinkingStep[]): ThinkingVisualization;
    private analyzeStep;
    private decomposeStep;
    private planStep;
    private executeStep;
    private validateStep;
}
