/**
 * Interface for thinking service operations
 * Defines methods for cognitive processing and reasoning
 */
import { ThinkingModel, ThinkingResult, ThinkingStep, ThinkingVisualization, ProcessConfig } from '../models/types.js';
export interface IThinkingService {
    /**
     * Initiates a thinking process for a given problem
     * @param config Configuration for the thinking process
     */
    initiateThinkingProcess(config: {
        problem: string;
        thinking_model?: string;
        include_visualization?: boolean;
        optimize_tokens?: boolean;
    }): Promise<ThinkingResult>;
    /**
     * Gets available thinking models
     * @returns Array of thinking model configurations
     */
    getThinkingModels(): ThinkingModel[];
    /**
     * Gets the progress of a thinking process
     * @param processId The ID of the thinking process
     * @returns Current progress and steps
     */
    getThinkingProgress(processId: string): Promise<{
        processId: string;
        status: 'in_progress' | 'completed' | 'error';
        steps: ThinkingStep[];
        progress: number;
        error?: string;
    }>;
    /**
     * Visualizes a thinking process
     * @param processId The ID of the thinking process
     * @returns Visualization data
     */
    visualizeThinkingProcess(processId: string): Promise<ThinkingVisualization>;
    /**
     * Gets thinking process history
     * @param limit Maximum number of processes to retrieve
     * @returns Array of past thinking processes
     */
    getThinkingHistory(limit?: number): Promise<Array<{
        processId: string;
        problem: string;
        model: string;
        timestamp: string;
        steps: number;
        duration: number;
    }>>;
    /**
     * Evaluates the effectiveness of a thinking process
     * @param processId The ID of the thinking process
     * @returns Evaluation metrics
     */
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
    /**
     * Performs maintenance on the thinking system
     * @returns Number of items cleaned up
     */
    performThinkingMaintenance(): Promise<number>;
    /**
     * Updates process configuration
     * @param config New configuration settings
     */
    updateProcessConfig(config: Partial<ProcessConfig>): Promise<void>;
    /**
     * Gets current process configuration
     * @returns Current configuration settings
     */
    getProcessConfig(): ProcessConfig;
}
