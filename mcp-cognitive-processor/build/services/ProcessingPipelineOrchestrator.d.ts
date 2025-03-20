/**
 * Orchestrates the step-by-step processing pipeline using multiple AI models
 * Each step processes the output from the previous step in a sequential manner
 */
import { IAIService } from '../interfaces/IAIService.js';
import { LLMResponse } from '../models/types.js';
export interface PipelineStep {
    name: string;
    service: IAIService;
    systemPrompt?: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
}
export interface PipelineResult {
    finalResponse: LLMResponse;
    intermediateResults: LLMResponse[];
    success: boolean;
    error?: Error;
    totalLatency: number;
    totalTokens: number;
}
export declare class ProcessingPipelineOrchestrator {
    private steps;
    private debugMode;
    constructor(debugMode?: boolean);
    /**
     * Add a step to the processing pipeline
     * Steps will be executed in the order they are added
     */
    addStep(step: PipelineStep): void;
    /**
     * Execute the pipeline steps sequentially
     * Each step receives the output from the previous step
     */
    execute(initialPrompt: string): Promise<PipelineResult>;
    /**
     * Get statistics about the pipeline steps
     */
    getStats(): any;
    /**
     * Clear all steps from the pipeline
     */
    clearSteps(): void;
}
