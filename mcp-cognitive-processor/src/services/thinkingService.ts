/**
 * Thinking Service
 * Provides access to different thinking models and strategies
 */
import { IThinkingService } from '../interfaces/IThinkingService.js';
import { ThinkingModel, ThinkingResult, ThinkingVisualization, ProcessConfig } from '../models/types.js';
import { ServiceFactory } from '../factories/ServiceFactory.js';
import { ThinkingServiceImpl } from './ThinkingServiceImpl.js';
import { GeminiService } from './GeminiService.js';

class ThinkingService implements IThinkingService {
    private thinkingServiceImpl: ThinkingServiceImpl;

    constructor() {
        const serviceFactory = ServiceFactory;
        const tokenOptimizer = ServiceFactory.getTokenOptimizer();
        const mcpConfig = ServiceFactory.getDefaultConfig();

        // Initialize Gemini service with OpenRouter API key
        const openRouterApiKey = process.env.OPENROUTER_API_KEY || '';
        if (!openRouterApiKey) {
          console.warn('WARNING: OPENROUTER_API_KEY is not set. API calls will fail until this is configured.');
        }
        const geminiService = new GeminiService(openRouterApiKey);

        // Create thinking service with Gemini
        this.thinkingServiceImpl = new ThinkingServiceImpl(serviceFactory, tokenOptimizer, mcpConfig, geminiService);
    }

  getThinkingModels(): ThinkingModel[] {
    return this.thinkingServiceImpl.getThinkingModels();
  }

  async initiateThinkingProcess(config: {
    problem: string;
    thinking_model?: string;
    include_visualization?: boolean;
    optimize_tokens?: boolean;
  }): Promise<ThinkingResult> {
    return this.thinkingServiceImpl.initiateThinkingProcess(config);
  }

  async getThinkingProgress(processId: string): Promise<{ processId: string; status: 'in_progress' | 'completed' | 'error'; steps: import("../models/types.js").ThinkingStep[]; progress: number; error?: string | undefined; }> {
    return this.thinkingServiceImpl.getThinkingProgress(processId);
  }

  async visualizeThinkingProcess(processId: string): Promise<ThinkingVisualization> {
    return this.thinkingServiceImpl.visualizeThinkingProcess(processId);
  }

  async getThinkingHistory(limit?: number): Promise<Array<{ processId: string; problem: string; model: string; timestamp: string; steps: number; duration: number; }>> {
    return this.thinkingServiceImpl.getThinkingHistory(limit);
  }

  async evaluateThinkingProcess(processId: string): Promise<{ processId: string; metrics: { accuracy: number; complexity: number; efficiency: number; novelty: number; }; recommendations: string[]; }> {
    return this.thinkingServiceImpl.evaluateThinkingProcess(processId);
  }

  async performThinkingMaintenance(): Promise<number> {
    return this.thinkingServiceImpl.performThinkingMaintenance();
  }
  async updateProcessConfig(config: Partial<ProcessConfig>): Promise<void> {
    return this.thinkingServiceImpl.updateProcessConfig(config);
  }

  getProcessConfig(): ProcessConfig {
    return this.thinkingServiceImpl.getProcessConfig();
  }
}

const thinkingService = new ThinkingService();
export default thinkingService;
