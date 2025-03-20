import { IAIService } from '../interfaces/IAIService.js';
export declare class GeminiServiceAdapter implements IAIService {
    private apiKey;
    constructor(apiKey: string);
    query(params: {
        inputs: string;
        max_tokens?: number;
    }): Promise<any>;
    private formatGeminiResponse;
}
