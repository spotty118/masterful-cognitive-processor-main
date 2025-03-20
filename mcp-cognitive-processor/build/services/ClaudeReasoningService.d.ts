import { IAIService } from '../interfaces/IAIService.js';
import { PreprocessingResult } from './GeminiPreprocessingService.js';
export interface ReasoningResult {
    detailedAnalysis: {
        conclusions: string[];
        recommendations: string[];
        technicalDetails?: {
            implementation: string;
            considerations: string[];
            alternatives: string[];
        };
    };
    reasoning: {
        path: string[];
        justification: string;
    };
    confidence: number;
}
export declare class ClaudeReasoningService {
    private aiService;
    constructor(aiService: IAIService);
    performDeepReasoning(preprocessedData: PreprocessingResult): Promise<ReasoningResult>;
    private constructDetailedPrompt;
    private parseClaudeResponse;
}
