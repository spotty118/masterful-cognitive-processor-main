import { LLMRequest, LLMResponse } from "../models/types.js";
import { IAIService } from "../interfaces/IAIService.js";
export declare class DeepSeekServiceAdapter implements IAIService {
    private static instances;
    private openaiClient;
    private apiKey;
    private model;
    private instanceId;
    constructor(apiKey: string, model?: string);
    static getInstance(apiKey: string, model?: string): DeepSeekServiceAdapter;
    query(params: LLMRequest): Promise<LLMResponse>;
}
