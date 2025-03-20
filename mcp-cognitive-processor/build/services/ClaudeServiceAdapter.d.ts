import { IAIService } from '../interfaces/IAIService.js';
import { LLMRequest, LLMResponse } from '../models/types.js';
export declare class ClaudeServiceAdapter implements IAIService {
    private apiKey;
    private model;
    private static instance;
    private constructor();
    static getInstance(apiKey: string, model?: string): ClaudeServiceAdapter;
    query(params: LLMRequest): Promise<LLMResponse>;
    private formatClaudeResponse;
}
