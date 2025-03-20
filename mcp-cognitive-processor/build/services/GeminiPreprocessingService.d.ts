import { IAIService } from '../interfaces/IAIService.js';
export interface PreprocessingResult {
    structuredQuery: {
        mainObjective: string;
        subTasks: string[];
        relevantContext: string[];
    };
    initialAnalysis: {
        complexityScore: number;
        suggestedApproach: string;
        potentialChallenges: string[];
    };
    codeAnalysis?: {
        snippets: Array<{
            location: string;
            code: string;
            purpose: string;
        }>;
        fileSystemContext?: string[];
    };
}
export declare class GeminiPreprocessingService {
    private aiService;
    constructor(aiService: IAIService);
    preprocessQuery(query: string): Promise<PreprocessingResult>;
    private parseGeminiResponse;
}
