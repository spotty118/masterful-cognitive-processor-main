import { IThinkingService } from '../interfaces/IThinkingService.js';
import { IAIService } from '../interfaces/IAIService.js';
import { ServiceFactory } from '../factories/ServiceFactory.js';
import { TokenOptimizerImpl } from '../utils/TokenOptimizerImpl.js';
import { MCPConfig } from '../models/types.js';
import { ThinkingModel, ThinkingStep, ThinkingVisualization, ProcessConfig } from '../models/types.js';
interface ThinkingInsight {
    type: string;
    location?: string;
    suggestion?: string;
    reasoning?: string;
    confidence?: number;
    category?: string;
}
interface LocalThinkingResult {
    insights: ThinkingInsight[];
    metrics: {
        codeAnalysis?: {
            suggestionsCount: number;
            filesAnalyzed: number;
        };
        [key: string]: any;
    };
}
export declare class ThinkingServiceImpl implements IThinkingService {
    private readonly serviceFactory;
    private readonly tokenOptimizer;
    private readonly config;
    private processConfig;
    private activeProcesses;
    private aiService;
    constructor(serviceFactory: ServiceFactory, tokenOptimizer: TokenOptimizerImpl, config: MCPConfig, aiService: IAIService);
    getThinkingModels(): ThinkingModel[];
    initiateThinkingProcess(config: {
        problem: string;
        thinking_model?: string;
        include_visualization?: boolean;
        optimize_tokens?: boolean;
    }): Promise<{
        processId: string;
        steps: ThinkingStep[];
        duration: number;
        model: string;
        visualization?: ThinkingVisualization;
    }>;
    getThinkingProgress(processId: string): Promise<{
        processId: string;
        status: 'in_progress' | 'completed' | 'error';
        steps: ThinkingStep[];
        progress: number;
        error?: string;
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
    private selectThinkingModel;
    private assessProblemComplexity;
    private storeProcessHistory;
    /**
     * Integrate code analysis with thinking process
     */
    private integrateCodeAnalysis;
    /**
     * Extract code snippets from context
     */
    private extractCodeSnippets;
    /**
     * Process thinking with integrated code analysis
     */
    processThinking(request: any): Promise<LocalThinkingResult>;
    /**
     * Transform code analysis results into thinking insights
     */
    private transformCodeSuggestions;
    /**
     * Determine if code analysis should be performed
     */
    private shouldAnalyzeCode;
}
export {};
