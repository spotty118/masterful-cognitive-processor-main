import { IAIService } from '../interfaces/IAIService.js';
export declare class GeminiServiceOpenAI implements IAIService {
    private apiKey;
    private openaiClient;
    private defaultModel;
    constructor(apiKey: string, modelName?: string);
    query(data: any): Promise<any>;
}
