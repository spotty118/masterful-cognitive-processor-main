import { LLMRequest, LLMResponse } from "../models/types.js";
import { IAIService } from "../interfaces/IAIService.js";
export declare class GoogleFlashServiceAdapter implements IAIService {
    private apiKey;
    private model;
    private openaiClient;
    private instanceId;
    constructor(apiKey: string);
    query(params: LLMRequest): Promise<LLMResponse>;
}
