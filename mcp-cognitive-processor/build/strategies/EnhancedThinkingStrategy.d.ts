/**
 * Enhanced thinking strategy implementation
 * Implements advanced reasoning with confidence scoring, alternative paths,
 * and detailed metrics tracking
 */
import { ThinkingStep, ThinkingModel, ThinkingVisualization } from '../models/types.js';
import { ITokenOptimizer } from '../interfaces/ITokenOptimizer.js';
import { BaseThinkingStrategy } from './BaseThinkingStrategy.js';
import { AlternativePath, StrategyMetrics } from '../interfaces/IThinkingModelStrategy.js';
export declare class EnhancedThinkingStrategy extends BaseThinkingStrategy {
    private problem;
    private currentPhase;
    private phases;
    private completed;
    private alternativePaths;
    private currentConfidence;
    private uncertaintyFactors;
    private complexityScore;
    constructor(model: ThinkingModel, tokenOptimizer: ITokenOptimizer);
    initialize(problem: string): Promise<void>;
    executeNextStep(): Promise<ThinkingStep>;
    shouldContinue(): boolean;
    getProgress(): number;
    getMetrics(): Promise<StrategyMetrics>;
    generateAlternativePaths(count: number): Promise<AlternativePath[]>;
    calculateConfidence(): Promise<number>;
    explainConfidence(): Promise<string>;
    compareAlternativePaths(): Promise<{
        differences: string[];
        tradeoffs: {
            [key: string]: string;
        };
        recommendation: string;
    }>;
    private analyzeComplexity;
    private countKeyComponents;
    private assessInteractions;
    private evaluateConstraints;
    private calculateStepConfidence;
    private assessStepCompleteness;
    private evaluateStepCohesion;
    private generateAlternativePath;
    private analyzeDifferences;
    private analyzeTradeoffs;
    private generateRecommendation;
    private computeStepTokenEfficiency;
    private analyzeStep;
    private exploreAlternativesStep;
    private evaluateApproachesStep;
    private planStep;
    private executeStep;
    private validateStep;
    private reflectStep;
    generateVisualization(steps: ThinkingStep[]): ThinkingVisualization;
}
