import { IAIService } from '../interfaces/IAIService.js';
export declare class O1MiniService implements IAIService {
    private apiKey;
    private openaiClient;
    private readonly MODEL;
    constructor(apiKey: string);
    query(data: any): Promise<any>;
}
