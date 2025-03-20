/**
 * Service for interacting with OpenRouter API
 * With enhanced timeout handling and retry logic
 */

import fetch from 'node-fetch';
import { setTimeout } from 'timers/promises';
import OpenAI from 'openai';
import { IAIService } from '../interfaces/IAIService.js';
import { LLMRequest, LLMResponse } from '../models/types.js';
import { TokenOptimizationMonitor } from '../utils/TokenOptimizationMonitor.js';

// Define interface for service options
export interface OpenRouterServiceOptions {
  timeoutMs?: number;         // Request timeout in milliseconds
  maxRetries?: number;        // Maximum number of retries on failure
  retryDelayMs?: number;      // Delay between retries in milliseconds
  adaptiveTimeout?: boolean;  // Whether to increase timeout for each retry
  model?: string;             // Model ID to use
}

// Default options
const DEFAULT_OPTIONS: OpenRouterServiceOptions = {
  timeoutMs: 30000,          // 30 seconds default timeout
  maxRetries: 3,             // 3 retries by default
  retryDelayMs: 1000,        // 1 second delay between retries
  adaptiveTimeout: true,     // Increase timeout for each retry
  model: 'google/gemini-2.0-pro-exp-02-05:free'
};

interface RequestQueueItem {
  request: LLMRequest;
  resolve: (value: LLMResponse) => void;
  reject: (reason?: any) => void;
  timestamp: number;
  retryCount: number;
}

export class OpenRouterService implements IAIService {
  // Map to store instances by model name
  private static instances: Map<string, OpenRouterService> = new Map();
  
  private apiKey: string;
  private baseUrl: string = 'https://openrouter.ai/api/v1';
  private model: string;
  private options: OpenRouterServiceOptions;
  private client: OpenAI;
  private requestQueue: RequestQueueItem[] = [];
  private processing: boolean = false;
  private maxConcurrent: number = 3;
  private activeRequests: number = 0;
  private tokenMonitor: TokenOptimizationMonitor;
  private requestTimeout: number = 30000; // 30 seconds
  private maxRetries: number = 3;
  private batchSize: number = 5;
  private rateLimitDelay: number = 100; // 100ms between requests
  private instanceId: string; // Unique identifier for this instance

  private constructor(apiKey: string, options?: OpenRouterServiceOptions) {
    if (!apiKey) {
      throw new Error('OpenRouter API key is required');
    }

    this.apiKey = apiKey;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.model = this.options.model || DEFAULT_OPTIONS.model!;
    this.instanceId = this.model; // Use model name as instance ID
    
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
      defaultHeaders: {
        'HTTP-Referer': 'https://localhost',
        'X-Title': 'Masterful Cognitive Processor'
      }
    });

    this.tokenMonitor = TokenOptimizationMonitor.getInstance();
    this.startQueueProcessor();
    
    console.log(`OpenRouterService instance created for model: ${this.model}`);
  }

  /**
   * Get an instance for a specific model. Creates a new instance if one doesn't exist.
   * Each instance has its own request queue to ensure step isolation.
   */
  public static getInstance(apiKey: string, options?: OpenRouterServiceOptions): OpenRouterService {
    const modelName = options?.model || DEFAULT_OPTIONS.model!;
    
    // Add a timestamp to ensure we get a truly unique instance each time to force separate API calls
    // This ensures that different pipeline steps don't share service instances
    const instanceKey = `${modelName}_${Date.now()}`;
    
    console.log(`Creating new OpenRouterService instance for model: ${modelName} with key: ${instanceKey}`);
    const instance = new OpenRouterService(apiKey, options);
    this.instances.set(instanceKey, instance);
    
    return instance;
  }

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
  async query(options: LLMRequest): Promise<LLMResponse> {
    // Use the model from options, or fall back to this instance's model
    const modelToUse = options.model || this.model;
    console.log(`OpenRouter query for model: ${modelToUse} (instance: ${this.instanceId})`);
    
    // Determine which step this is based on the model
    let stepInfo = "Unknown step";
    if (modelToUse.includes('flash')) {
      stepInfo = "STEP 1: Google Flash (preprocessing)";
    } else if (modelToUse.includes('gemini-2.0-pro')) {
      stepInfo = "STEP 2: Gemini Pro (preprocessing)";
    } else if (modelToUse.includes('deepseek')) {
      stepInfo = "STEP 3: DeepSeek R1 (prereasoning)";
    }
    
    console.log(`${stepInfo} - Starting OpenRouter API call [STEP ISOLATION ENFORCED]`);
    
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        request: {
          ...options,
          model: modelToUse // Ensure model is always set
        },
        resolve: (response) => {
          console.log(`${stepInfo} - Completed successfully`);
          resolve(response);
        },
        reject: (error) => {
          console.error(`${stepInfo} - Failed:`, error);
          reject(error);
        },
        timestamp: Date.now(),
        retryCount: 0
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.requestQueue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      while (this.requestQueue.length > 0) {
        // Wait if we've hit concurrency limit
        if (this.activeRequests >= this.maxConcurrent) {
          await setTimeout(this.rateLimitDelay);
          continue;
        }

        // Process only one request at a time to ensure step isolation
        // This prevents batching that might cause steps to be processed together
        const item = this.requestQueue.shift();
        if (item) {
          this.activeRequests += 1;
          await this.processRequest(item).catch(e => console.error('Error processing request:', e));
          this.activeRequests -= 1;
        }

        // Add a small delay between requests to ensure separation
        await setTimeout(this.rateLimitDelay);
      }
    } catch (error) {
      console.error('Error in queue processor:', error);
    } finally {
      this.processing = false;
    }
  }

  private async processRequest(queueItem: RequestQueueItem): Promise<void> {
    const { request, resolve, reject, timestamp, retryCount } = queueItem;

    // Check for timeout
    if (Date.now() - timestamp > this.requestTimeout) {
      reject(new Error('Request timeout'));
      return;
    }

    try {
      // Determine which step this is based on the model
      let stepInfo = "Unknown step";
      if (request.model?.includes('flash')) {
        stepInfo = "STEP 1: Google Flash (preprocessing)";
      } else if (request.model?.includes('gemini-2.0-pro')) {
        stepInfo = "STEP 2: Gemini Pro (advanced processing)";
      } else if (request.model?.includes('deepseek')) {
        stepInfo = "STEP 3: DeepSeek R1 (preliminary reasoning)";
      }
      
      console.log(`${stepInfo} - Preparing request for OpenRouter`);
      
      const messages = request.messages?.map(msg => ({
        role: msg.role as any,
        content: msg.content
      })) || [];

      if (request.systemPrompt) {
        messages.unshift({ role: 'system', content: request.systemPrompt });
      } else if (request.prompt && !request.messages) {
        messages.push({ role: 'user', content: request.prompt });
      }

      const startTime = Date.now();
      console.log(`${stepInfo} - Sending to OpenRouter API with model: ${request.model || this.model}`);
      
      const completion = await this.client.chat.completions.create({
        model: request.model || this.model,
        messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 1000,
      });
      
      console.log(`${stepInfo} - Received response from OpenRouter`);

      const response: LLMResponse = {
        response: completion.choices[0].message.content || '',
        model: request.model || 'openai/gpt-3.5-turbo',
        tokenUsage: {
          prompt: completion.usage?.prompt_tokens || 0,
          completion: completion.usage?.completion_tokens || 0,
          total: completion.usage?.total_tokens || 0
        },
        latency: Date.now() - startTime
      };

      // Record token usage for monitoring
      this.tokenMonitor.recordOptimization(
        response.tokenUsage.total,
        response.tokenUsage.total,
        response.model
      );

      resolve(response);

    } catch (error) {
      console.error('Error processing request:', error);

      // Handle retries
      if (retryCount < this.maxRetries) {
        console.log(`Retrying request (attempt ${retryCount + 1}/${this.maxRetries})`);
        this.requestQueue.push({
          ...queueItem,
          retryCount: retryCount + 1,
          timestamp: Date.now()
        });
      } else {
        reject(error);
      }
    }
  }

  private startQueueProcessor(): void {
    // Start periodic queue check
    setInterval(() => {
      if (!this.processing && this.requestQueue.length > 0) {
        this.processQueue();
      }
    }, 100); // Check every 100ms

    // Start periodic timeout check
    setInterval(() => {
      const now = Date.now();
      this.requestQueue = this.requestQueue.filter(item => {
        if (now - item.timestamp > this.requestTimeout) {
          item.reject(new Error('Request timeout'));
          return false;
        }
        return true;
      });
    }, 1000); // Check every second
  }

  public getQueueStats() {
    return {
      queueLength: this.requestQueue.length,
      activeRequests: this.activeRequests,
      isProcessing: this.processing
    };
  }

  public updateConfig(config: {
    maxConcurrent?: number;
    requestTimeout?: number;
    maxRetries?: number;
    batchSize?: number;
    rateLimitDelay?: number;
  }) {
    if (config.maxConcurrent !== undefined) this.maxConcurrent = config.maxConcurrent;
    if (config.requestTimeout !== undefined) this.requestTimeout = config.requestTimeout;
    if (config.maxRetries !== undefined) this.maxRetries = config.maxRetries;
    if (config.batchSize !== undefined) this.batchSize = config.batchSize;
    if (config.rateLimitDelay !== undefined) this.rateLimitDelay = config.rateLimitDelay;
  }
  
  // Get the model this instance is configured for
  public getModel(): string {
    return this.model;
  }
}
