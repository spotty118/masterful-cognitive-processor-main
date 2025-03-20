/**
 * State management system for the ThinkingEngine
 * Enables tracking and dynamic adjustments during execution
 */

import { ThinkingModel, ThinkingStep } from '../models/types.js';

/**
 * Execution phase of the thinking process
 */
export enum ExecutionPhase {
  Initializing = 'initializing',
  ProblemAnalysis = 'problem_analysis',
  StrategySelection = 'strategy_selection',
  Execution = 'execution',
  Conclusion = 'conclusion',
  Error = 'error',
  Completed = 'completed'
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
  significanceScore?: number; // How relevant the reasoning is to the original problem
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
  tokenEfficiency?: number; // Tokens per unit of progress
  timeEfficiency?: number; // Time per unit of progress
  predictedCompletion?: number; // Predicted ms until completion
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
export class ThinkingEngineState {
  private phase: ExecutionPhase = ExecutionPhase.Initializing;
  private startTime: number = Date.now();
  private steps: ThinkingStep[] = [];
  private currentStepIndex: number = 0;
  private problemId: string;
  private originalProblem: string;
  private processedProblem: string;
  private problemType: string = 'general';
  private metadata: Map<string, any> = new Map();
  private readonly initialTokenBudget: number;
  private tokensUsed: number = 0;
  private stepTokenUsage: Map<string, number> = new Map();
  private readonly maxSteps: number;
  private reasoningSystemName: string;
  private modelName: string;
  private adjustments: Map<string, any> = new Map();
  private adjustmentHistory: Array<{
    timestamp: string;
    adjustment: string;
    trigger: string;
    details: any;
  }> = [];
  private metrics: ProgressMetrics = {
    confidence: 0,
    relevantConcepts: 0,
    identifiedChallenges: 0,
    hasAlternatives: false,
    complexityScore: 0
  };

  constructor(params: {
    problemId: string;
    problem: string;
    tokenBudget: number;
    maxSteps: number;
    model: ThinkingModel;
    reasoningSystem: { name: string; description: string; implementation: string };
    enableDynamicAdjustment?: boolean;
  }) {
    this.problemId = params.problemId;
    this.originalProblem = params.problem;
    this.processedProblem = params.problem;
    this.initialTokenBudget = params.tokenBudget;
    this.maxSteps = params.maxSteps;
    this.modelName = params.model.name;
    this.reasoningSystemName = params.reasoningSystem.name;
  }

  public getCurrentPhase(): ExecutionPhase {
    return this.phase;
  }

  public updateMetrics(metrics: ProgressMetrics): void {
    this.metrics = { ...this.metrics, ...metrics };
  }

  public getProgressMetrics(): ProgressMetrics {
    return this.metrics;
  }

  public getAdjustments(): Array<{type: string; timestamp: string; details: any}> {
    return this.adjustmentHistory.map(adj => ({
      type: adj.adjustment,
      timestamp: adj.timestamp,
      details: adj.details
    }));
  }

  public setPhase(phase: ExecutionPhase): void {
    this.phase = phase;
  }

  public addStep(step: ThinkingStep & { 
    id?: string; 
    tokens?: number;
    metrics?: {
      coherence?: number;
      complexity?: number;
      significanceScore?: number;
    };
  }): void {
    this.steps.push(step);
    if (step.id && step.tokens) {
      this.stepTokenUsage.set(step.id, step.tokens);
      this.tokensUsed += step.tokens;
    }
    this.currentStepIndex = this.steps.length;
  }

  public recordAdjustment(type: string, details: any): void {
    this.adjustmentHistory.push({
      timestamp: new Date().toISOString(),
      adjustment: type,
      trigger: 'system',
      details
    });
  }

  /**
   * Get all previous reasoning steps for coherence calculation
   * @returns Array of previous reasoning strings
   */
  public getPreviousReasoning(): string[] {
    return this.steps.map(step => step.reasoning);
  }

  /**
   * Get the current problem for significance calculation
   * @returns The processed problem text
   */
  public getProblem(): string {
    return this.processedProblem;
  }
}
