/**
 * State management system for the ThinkingEngine
 * Enables tracking and dynamic adjustments during execution
 */
import { ThinkingModel, ThinkingStep } from '../models/types.js';
/**
 * Execution phase of the thinking process
 */
export declare enum ExecutionPhase {
    Initializing = "initializing",
    ProblemAnalysis = "problem_analysis",
    StrategySelection = "strategy_selection",
    Execution = "execution",
    Conclusion = "conclusion",
    Error = "error",
    Completed = "completed"
}
/**
 * Progress metrics of the thinking process
 */
export interface ProgressMetrics {
    confidence: number;
    relevantConcepts: number;
    identifiedChallenges: number;
    hasAlternatives: boolean;
    complexityScore: number;
    significanceScore?: number;
}
/**
 * Resource usage during the thinking process
 */
export interface ResourceUsage {
    tokensUsed: number;
    tokenLimit: number;
    timeElapsedMs: number;
    timeLimit: number;
    memoryUsed?: number;
    tokenEfficiency?: number;
    timeEfficiency?: number;
    predictedCompletion?: number;
}
/**
 * Options for dynamic adjustments
 */
export interface AdjustmentOptions {
    increasePrecision: boolean;
    increaseCoverage: boolean;
    reduceTokenUsage: boolean;
    accelerateExecution: boolean;
    requestMoreContext: boolean;
    switchStrategy: boolean;
    backtrackSteps: number;
    reevaluateProgress: boolean;
}
/**
 * Represents current state of the thinking process
 */
export declare class ThinkingEngineState {
    private phase;
    private startTime;
    private steps;
    private currentStepIndex;
    private problemId;
    private originalProblem;
    private processedProblem;
    private problemType;
    private metadata;
    private readonly initialTokenBudget;
    private tokensUsed;
    private stepTokenUsage;
    private readonly maxSteps;
    private reasoningSystemName;
    private modelName;
    private adjustments;
    private adjustmentHistory;
    private metrics;
    constructor(params: {
        problemId: string;
        problem: string;
        tokenBudget: number;
        maxSteps: number;
        model: ThinkingModel;
        reasoningSystem: {
            name: string;
            description: string;
            implementation: string;
        };
        enableDynamicAdjustment?: boolean;
    });
    getCurrentPhase(): ExecutionPhase;
    updateMetrics(metrics: ProgressMetrics): void;
    getProgressMetrics(): ProgressMetrics;
    getAdjustments(): Array<{
        type: string;
        timestamp: string;
        details: any;
    }>;
    setPhase(phase: ExecutionPhase): void;
    addStep(step: ThinkingStep & {
        id?: string;
        tokens?: number;
        metrics?: {
            coherence?: number;
            complexity?: number;
            significanceScore?: number;
        };
    }): void;
    recordAdjustment(type: string, details: any): void;
    /**
     * Get all previous reasoning steps for coherence calculation
     * @returns Array of previous reasoning strings
     */
    getPreviousReasoning(): string[];
    /**
     * Get the current problem for significance calculation
     * @returns The processed problem text
     */
    getProblem(): string;
}
