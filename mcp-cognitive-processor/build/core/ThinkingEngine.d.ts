/**
 * Core thinking engine that powers cognitive processing
 * Implements different thinking strategies and reasoning systems
 * Enhanced with state management for dynamic adjustments during execution
 */
import { MCPConfig, ThinkingModel, ThinkingStep } from '../models/types.js';
import { TokenOptimizerImpl } from '../utils/TokenOptimizerImpl.js';
import { OpenRouterService } from '../services/OpenRouterService.js';
import { ProgressMetrics } from './ThinkingEngineState.js';
export interface AIModelAnalysisResult {
    suggestedStepDescription: string;
    insights: string[];
    shouldContinue: boolean;
    confidence?: number;
    alternativeSuggestions?: string[];
    identifiedChallenges?: string[];
    relevantConcepts?: string[];
}
export interface IReasoningStrategySelector {
    selectReasoningSystem(problem: string): Promise<{
        name: string;
        description: string;
        implementation: string;
    }>;
}
export declare class ThinkingEngine {
    private readonly config;
    private readonly tokenOptimizer;
    private currentStrategy;
    private reasoningStrategySelector;
    private openRouterService;
    private engineState;
    private static readonly DEFAULT_MAX_TOKENS_PER_STEP;
    private static readonly DEFAULT_TOKEN_USAGE_THRESHOLD;
    private static readonly TOKEN_CACHE_SIZE;
    private static readonly COHERENCE_THRESHOLD;
    private static readonly MAX_PREVIOUS_STEPS;
    constructor(config: MCPConfig, tokenOptimizer: TokenOptimizerImpl, strategySelector?: IReasoningStrategySelector, openRouterService?: OpenRouterService);
    /**
     * Initialize services with proper error handling and fallbacks
     */
    private initializeServices;
    /**
     * Initialize strategy selector with improved error handling and fallbacks
     */
    private initializeStrategySelector;
    /**
     * Create emergency fallback selector when other options fail
     */
    private createEmergencySelector;
    /**
     * Initialize token optimizer with error handling
     */
    private initializeTokenOptimizer;
    /**
     * Process a problem using selected reasoning system
     */
    processProblem(problem: string, model: ThinkingModel, options?: {
        maxSteps?: number;
        systemPrompt?: string;
        optimizeTokens?: boolean;
        parallelAnalysis?: boolean;
        enableDynamicAdjustment?: boolean;
    }): Promise<{
        steps: ThinkingStep[];
        reasoning: string[];
        tokenUsage: number;
        executionTime: number;
        stateMetrics?: {
            adjustments: Array<{
                type: string;
                timestamp: string;
                details: any;
            }>;
            progressMetrics: ProgressMetrics;
            finalState: string;
        };
        optimization?: {
            strategy: string;
            tokenSavings: number;
            optimizedProblem?: string;
        };
    }>;
    /**
     * Initialize the problem processing state
     */
    private initializeProcessing;
    /**
     * Execute the main problem processing logic
     */
    private executeProcessing;
    /**
     * Execute a single thinking step
     */
    private executeThinkingStep;
    /**
     * Analyze model response with improved error handling and validation
     */
    private analyzeModelResponse;
    /**
     * Parse and validate model response
     */
    private parseModelResponse;
    /**
     * Extract step description from parsed response
     */
    private extractStepDescription;
    /**
     * Extract insights from parsed response
     */
    private extractInsights;
    /**
     * Extract insights from analysis section
     */
    private extractInsightsFromAnalysis;
    /**
     * Determine if processing should continue
     */
    private shouldContinueProcessing;
    /**
     * Extract confidence score from parsed response
     */
    private extractConfidence;
    /**
     * Extract alternative suggestions from parsed response
     */
    private extractAlternatives;
    /**
     * Extract challenges from parsed response
     */
    private extractChallenges;
    /**
     * Extract relevant concepts from parsed response
     */
    private extractConcepts;
    /**
     * Create fallback analysis for error cases
     */
    private createFallbackAnalysis;
    /**
     * Process step results and update engine state
     */
    private processStepResults;
    /**
     * Calculate coherence score for a step
     * Measures logical connections between reasoning steps by analyzing shared key terms and phrases
     */
    private calculateCoherenceScore;
    /**
     * Extract key terms from reasoning text
     * @private
     */
    private extractKeyTerms;
    /**
     * Calculate term overlap between two sets of terms
     * @private
     */
    private calculateTermOverlap;
    /**
     * Calculate significance score for a step
     * Evaluates how relevant each reasoning step is to the original problem
     */
    private calculateSignificanceScore;
    /**
     * Calculate complexity score for a step
     */
    private calculateComplexityScore;
    /**
     * Estimate token usage for a step
     */
    private estimateStepTokens;
    /**
     * Handle step execution errors
     */
    private handleStepError;
    /**
     * Handle processing errors at the problem level
     */
    private handleProcessingError;
    /**
     * Finalize processing and prepare results
     */
    private finalizeProcessing;
    /**
     * Build context for a thinking step
     */
    private buildStepContext;
    /**
     * Query the AI model with proper error handling
     */
    private queryModel;
    /**
     * Optimize context using token optimizer
     */
    private optimizeContext;
    /**
     * Select reasoning system based on problem analysis
     */
    private selectReasoningSystem;
    /**
     * Utility method to generate unique problem ID
     */
    private generateProblemId;
    /**
     * Calculate token budget based on model and options
     */
    private calculateTokenBudget;
    /**
     * Prepare context for a thinking step
     */
    private prepareStepContext;
    /**
     * Select relevant previous steps for context
     */
    private selectRelevantSteps;
}
