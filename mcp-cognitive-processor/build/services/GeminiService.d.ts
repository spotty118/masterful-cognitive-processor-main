import { IAIService } from '../interfaces/IAIService.js';
import { EventEmitter } from 'events';
export interface StreamingOptions {
    enableStreaming?: boolean;
    onToken?: (token: string) => void;
    maxTokens?: number;
    temperature?: number;
}
export type GeminiVariant = 'pro' | 'flash';
export declare class GeminiService extends EventEmitter implements IAIService {
    private apiKey;
    private modelEndpoint;
    private modelName;
    private modelVariant;
    private fallbackEnabled;
    constructor(apiKey: string, modelVariant?: GeminiVariant, enableFallback?: boolean);
    private getModelNameForVariant;
    private getHeaders;
    private handleErrorResponse;
    query(data: any, options?: StreamingOptions): Promise<any>;
    private handleStreamingResponse;
    createResponseStream(data: any, options?: StreamingOptions): AsyncGenerator<string>;
}
