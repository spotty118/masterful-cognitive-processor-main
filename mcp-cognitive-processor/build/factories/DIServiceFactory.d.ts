import { MCPConfig } from '../models/types.js';
export declare class DIServiceFactory {
    private static container;
    static initialize(config?: Partial<MCPConfig>): Promise<void>;
    /**
     * Initialize AI services including Gemini and Claude
     */
    private static initializeAIServices;
    /**
     * Initialize OpenRouter services with specific model configurations
     * Each service is a separate instance of OpenRouterService with its own model
     */
    private static initializeOpenRouterServices;
    /**
     * Initialize the Processing Pipeline Orchestrator
     * Sets up the sequential processing pipeline with all model steps
     */
    private static initializeProcessingPipeline;
    private static initializeModelFallback;
    private static initializeThinkingService;
    static getService<T>(name: string): T;
    /**
     * Check if a service exists in the container
     * @param name The name of the service to check
     * @returns True if the service exists, false otherwise
     */
    static hasService(name: string): boolean;
    private static isAIService;
    static createThinkingStrategy(model: any): any;
}
