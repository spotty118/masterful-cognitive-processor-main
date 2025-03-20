/**
 * Thinking Service
 * Provides access to different thinking models and strategies
 */
import { IThinkingService } from '../interfaces/IThinkingService.js';
import { ThinkingModel, ThinkingResult, ThinkingVisualization, ProcessConfig } from '../models/types.js';
declare class ThinkingService implements IThinkingService {
    private thinkingServiceImpl;
    constructor();
    getThinkingModels(): ThinkingModel[];
    initiateThinkingProcess(config: {
        problem: string;
        thinking_model?: string;
        include_visualization?: boolean;
        optimize_tokens?: boolean;
    }): Promise<ThinkingResult>;
    getThinkingProgress(processId: string): Promise<{
        processId: string;
        status: 'in_progress' | 'completed' | 'error';
        steps: import("../models/types.js").ThinkingStep[];
        progress: number;
        error?: string | undefined;
    }>;
    visualizeThinkingProcess(processId: string): Promise<ThinkingVisualization>;
    getThinkingHistory(limit?: number): Promise<Array<{
        processId: string;
        problem: string;
        model: string;
        timestamp: string;
        steps: number;
        duration: number;
    }>>;
    evaluateThinkingProcess(processId: string): Promise<{
        processId: string;
        metrics: {
            accuracy: number;
            complexity: number;
            efficiency: number;
            novelty: number;
        };
        recommendations: string[];
    }>;
    performThinkingMaintenance(): Promise<number>;
    updateProcessConfig(config: Partial<ProcessConfig>): Promise<void>;
    getProcessConfig(): ProcessConfig;
}
declare const thinkingService: ThinkingService;
export default thinkingService;
