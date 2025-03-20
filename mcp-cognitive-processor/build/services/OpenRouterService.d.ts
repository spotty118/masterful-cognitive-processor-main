/**
 * Service for interacting with OpenRouter API
 * With enhanced timeout handling and retry logic
 */
import { IAIService } from '../interfaces/IAIService.js';
import { LLMRequest, LLMResponse } from '../models/types.js';
export interface OpenRouterServiceOptions {
    timeoutMs?: number;
    maxRetries?: number;
    retryDelayMs?: number;
    adaptiveTimeout?: boolean;
    model?: string;
}
export declare class OpenRouterService implements IAIService {
    private static instances;
    private apiKey;
    private baseUrl;
    private model;
    private options;
    private client;
    private requestQueue;
    private processing;
    private maxConcurrent;
    private activeRequests;
    private tokenMonitor;
    private requestTimeout;
    private maxRetries;
    private batchSize;
    private rateLimitDelay;
    private instanceId;
    private constructor();
    /**
     * Get an instance for a specific model. Creates a new instance if one doesn't exist.
     * Each instance has its own request queue to ensure step isolation.
     */
    static getInstance(apiKey: string, options?: OpenRouterServiceOptions): OpenRouterService;
    /**
     * Query the OpenRouter model with timeout handling and retries
     * @param options Query options with input text
     * @returns The model's response
     */
    /**
     * Query the OpenRouter model with timeout handling and retries
     * Each query is isolated to ensure separate API calls for each pipeline step
     * @param options Query options with input text
     * @returns The model's response
     */
    query(options: LLMRequest): Promise<LLMResponse>;
    private processQueue;
    private processRequest;
    private startQueueProcessor;
    getQueueStats(): {
        queueLength: number;
        activeRequests: number;
        isProcessing: boolean;
    };
    updateConfig(config: {
        maxConcurrent?: number;
        requestTimeout?: number;
        maxRetries?: number;
        batchSize?: number;
        rateLimitDelay?: number;
    }): void;
    getModel(): string;
}
