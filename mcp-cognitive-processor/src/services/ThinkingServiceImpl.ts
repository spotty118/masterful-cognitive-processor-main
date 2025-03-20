/**
 * Implementation of the thinking service
 * Provides core cognitive processing capabilities
 */
import * as process from 'process';
import { IThinkingService } from '../interfaces/IThinkingService.js';
import { IAIService } from '../interfaces/IAIService.js';
import { IReasoningStrategy } from '../interfaces/IReasoningStrategy.js';
import { ServiceFactory } from '../factories/ServiceFactory.js';
import { GeminiService } from '../services/GeminiService.js';
import { GeminiServiceOpenAI } from '../services/GeminiServiceOpenAI.js';
import { TokenOptimizerImpl } from '../utils/TokenOptimizerImpl.js';
import { MCPConfig } from '../models/types.js';
import {
  ThinkingModel,
  ThinkingStep,
  ThinkingVisualization,
  ProcessConfig
} from '../models/types.js';
import { BaseThinkingStrategy } from '../strategies/BaseThinkingStrategy.js';
import { ThinkingEngine } from '../core/ThinkingEngine.js';
import { MCPProcessor } from '../processor/MCPProcessor.js';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// Define the database file path
const DB_DIR = process.env.MCP_DB_DIR || path.join(process.cwd(), 'data');
const THINKING_DIR = path.join(DB_DIR, 'thinking');

// Ensure thinking directory exists
if (!fs.existsSync(THINKING_DIR)) {
  fs.mkdirSync(THINKING_DIR, { recursive: true });
}

// Define environment variables at the module level
// Direct reference to OpenRouter API key for Gemini
const OPENROUTER_API_KEY = process.env?.OPENROUTER_API_KEY || '';

interface ThinkingInsight {
  type: string;
  location?: string;
  suggestion?: string;
  reasoning?: string;
  confidence?: number;
  category?: string;
}

interface LocalThinkingResult {
  insights: ThinkingInsight[];
  metrics: {
    codeAnalysis?: {
      suggestionsCount: number;
      filesAnalyzed: number;
    };
    [key: string]: any;
  };
}

export class ThinkingServiceImpl implements IThinkingService {
  private readonly serviceFactory: ServiceFactory;
  private readonly tokenOptimizer: TokenOptimizerImpl;
  private readonly config: MCPConfig;
  private processConfig: ProcessConfig;
  private activeProcesses: Map<string, {
    status: 'in_progress' | 'completed' | 'error';
    strategy: BaseThinkingStrategy;
    steps: ThinkingStep[];
    startTime: number;
    error?: string;
  }>;
  private aiService: IAIService;

  constructor(
    serviceFactory: ServiceFactory,
    tokenOptimizer: TokenOptimizerImpl,
    config: MCPConfig,
    aiService: IAIService
  ) {
    if (!aiService) {
      throw new Error('AI service is required');
    }

    // Validate Gemini service configuration
    if (aiService instanceof GeminiService || aiService instanceof GeminiServiceOpenAI) {
      if (!process.env.OPENROUTER_API_KEY) {
        console.warn('WARNING: OPENROUTER_API_KEY not found in environment');
        throw new Error('OPENROUTER_API_KEY is required for Gemini service');
      }
      console.log('Initializing with Gemini API service using OpenRouter');
    }

    this.serviceFactory = serviceFactory;
    this.tokenOptimizer = tokenOptimizer;
    this.config = config;
    this.activeProcesses = new Map();
    this.processConfig = {
      maxStepsPerStrategy: 10,
      tokenBudget: 1000,
      optimizationThreshold: 0.7
    };
    this.aiService = aiService;

    console.log(`Initialized ThinkingServiceImpl with ${aiService.constructor.name}`);
    console.log('this.aiService:', this.aiService); // Log the aiService
  }

  getThinkingModels(): ThinkingModel[] {
    return this.config.core.thinkingModels;
  }

  async initiateThinkingProcess(config: {
    problem: string;
    thinking_model?: string;
    include_visualization?: boolean;
    optimize_tokens?: boolean;
  }): Promise<{
    processId: string;
    steps: ThinkingStep[];
    duration: number;
    model: string;
    visualization?: ThinkingVisualization;
  }> {
    const processId = uuidv4();
    const startTime = Date.now();
    
    try {
      // Input validation - ensure problem exists and is properly formatted
      if (!config) {
        throw new Error('Configuration object is required');
      }
      
      if (!config.problem) {
        throw new Error('Problem statement is required');
      }
      
      if (typeof config.problem !== 'string') {
        throw new Error('Problem must be a string');
      }
      
      if (config.problem.trim() === '') {
        throw new Error('Problem cannot be empty');
      }
      
      // Validate optional parameters
      if (config.thinking_model !== undefined && typeof config.thinking_model !== 'string') {
        throw new Error('thinking_model must be a string if provided');
      }
      
      if (config.include_visualization !== undefined && typeof config.include_visualization !== 'boolean') {
        throw new Error('include_visualization must be a boolean if provided');
      }
      
      if (config.optimize_tokens !== undefined && typeof config.optimize_tokens !== 'boolean') {
        throw new Error('optimize_tokens must be a boolean if provided');
      }
      
      // Log the process start
      console.log(`Initiating thinking process ${processId} for problem: "${config.problem.substring(0, 50)}${config.problem.length > 50 ? '...' : ''}" with model: ${config.thinking_model || 'auto-selected'}`);
      
      // Select thinking model
      const model = this.selectThinkingModel(config.thinking_model, config.problem);
      
      // Create strategy instance and Thinking Engine instance, passing the AI Service
      const strategy = ServiceFactory.createThinkingStrategy(model);
      
      // Verify AI service is properly initialized
      console.log('initiateThinkingProcess - this.aiService:', this.aiService); // Log before check
      if (!this.aiService) {
        throw new Error('AI service is required and must be properly initialized');
      }

      // Use the aiService that was passed to the constructor
      console.log(`Using AI service: ${this.aiService.constructor.name}`);
      
      // Verify if it's a GeminiService or GeminiServiceOpenAI and check API key
      // AI service was already validated in constructor
      console.log(`Using AI service: ${this.aiService.constructor.name}`);
      // Don't reassign this.aiService as it's already set in the constructor
      
      // After analyzing the error messages, it appears the ThinkingEngine constructor's third parameter
      // must be an object that implements both IAIService and has IReasoningStrategy capabilities.
      // Let's create a hybrid implementation that satisfies both interfaces:
      const hybridService = {
        // IAIService implementation
        query: async (data: any): Promise<any> => {
          // Simply delegate to the actual AI service
          return this.aiService.query(data);
        },
        
        // IReasoningStrategy implementation
        selectReasoningSystem: async (problem: string) => ({
          name: 'default',
          description: 'Default reasoning system',
          implementation: 'default_reasoning_system'
        })
      };
      
      // Try to get the OpenRouterService from the container
      let openRouterService;
      try {
        // Try to get the OpenRouterService from the container if available
        openRouterService = (this.serviceFactory as any).getService('openRouterService');
        console.log('Using OpenRouterService from container');
      } catch (error) {
        console.warn('OpenRouterService not found in container, will create one in ThinkingEngine');
      }
      
      // Create thinking engine with hybrid service and OpenRouterService
      const thinkingEngine = new ThinkingEngine(
        this.config,
        this.tokenOptimizer,
        hybridService as any,   // Cast to any to bypass the type checker's confusion
        openRouterService       // Pass the OpenRouterService if available
      );
      
      // Set up process tracking
      this.activeProcesses.set(processId, {
        status: 'in_progress',
        strategy: strategy as BaseThinkingStrategy,
        steps: [],
        startTime
      });
      
      // Initialize strategy
      await strategy.initialize(config.problem);
      
      // Execute steps using the ThinkingEngine
      const thinkingResult = await thinkingEngine.processProblem(config.problem, model, {
        maxSteps: this.processConfig.maxStepsPerStrategy,
        optimizeTokens: config.optimize_tokens
      });
      
      // Mark process as completed
      const duration = Date.now() - startTime;
      const process = this.activeProcesses.get(processId);
      if (process) {
          process.status = 'completed';
          process.steps = thinkingResult.steps; // Update with results from ThinkingEngine
      }
      
      // Prepare visualization if requested
      let visualization;
      if (config.include_visualization) {
        visualization = (strategy as BaseThinkingStrategy).generateVisualization(process!.steps);
      }
      
      // Store process history
      await this.storeProcessHistory({
        processId,
        problem: config.problem,
        model: model.name,
        steps: process!.steps,
        duration,
        timestamp: new Date().toISOString()
      });
      
      console.log(`Completed thinking process ${processId} in ${duration}ms with ${process!.steps.length} steps`);

      return {
        processId,
        steps: process!.steps,
        duration,
        model: model.name,
        visualization
      };
    } catch (error) {
      // Enhanced error handling with more detailed logging
      console.error(`Error in thinking process ${processId}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorDetails = {
        message: errorMessage,
        processId,
        timestamp: new Date().toISOString(),
        problem: config?.problem ? `${config.problem.substring(0, 50)}...` : 'undefined',
        duration: Date.now() - startTime
      };
      
      console.error('Error details:', JSON.stringify(errorDetails, null, 2));
      
      // Update process status
      const process = this.activeProcesses.get(processId);
      if (process) {
        process.status = 'error';
        process.error = errorMessage;
      }
      
      // Store the error in the process history
      try {
        await this.storeProcessHistory({
          processId,
          problem: config?.problem || 'Invalid problem',
          model: 'error',
          steps: [],
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          error: errorMessage
        });
      } catch (storageError) {
        console.error('Failed to store error in process history:', storageError);
      }
      
      throw error;
    }
  }

  async getThinkingProgress(processId: string): Promise<{
    processId: string;
    status: 'in_progress' | 'completed' | 'error';
    steps: ThinkingStep[];
    progress: number;
    error?: string;
  }> {
    const process = this.activeProcesses.get(processId);
    if (!process) {
      throw new Error(`Process not found: ${processId}`);
    }

    const progress = process.strategy.getProgress() * 100;

    return {
      processId,
      status: process.status,
      steps: process.steps,
      progress,
      error: process.error
    };
  }

  async visualizeThinkingProcess(processId: string): Promise<ThinkingVisualization> {
    const process = this.activeProcesses.get(processId);
    if (!process) {
      throw new Error(`Process not found: ${processId}`);
    }

    return process.strategy.generateVisualization(process.steps);
  }

  async getThinkingHistory(limit: number = 100): Promise<Array<{
    processId: string;
    problem: string;
    model: string;
    timestamp: string;
    steps: number;
    duration: number;
  }>> {
    try {
      const files = await fs.promises.readdir(THINKING_DIR);
      const history: Array<{
        processId: string;
        problem: string;
        model: string;
        timestamp: string;
        steps: number;
        duration: number;
      }> = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(THINKING_DIR, file);
        const data = await fs.promises.readFile(filePath, 'utf8');
        const process = JSON.parse(data);

        history.push({
          processId: process.processId,
          problem: process.problem,
          model: process.model,
          timestamp: process.timestamp,
          steps: process.steps.length,
          duration: process.duration
        });
      }

      return history
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting thinking history:', error);
      return [];
    }
  }

  async evaluateThinkingProcess(processId: string): Promise<{
    processId: string;
    metrics: {
      accuracy: number;
      complexity: number;
      efficiency: number;
      novelty: number;
    };
    recommendations: string[];
  }> {
    const process = this.activeProcesses.get(processId);
    if (!process) {
      throw new Error(`Process not found: ${processId}`);
    }

    // Calculate metrics
    const totalTokens = process.steps.reduce((sum, step) => sum + step.tokens, 0);
    const averageTokensPerStep = totalTokens / process.steps.length;
    const duration = Date.now() - process.startTime;
    const tokensPerSecond = totalTokens / (duration / 1000);

    const metrics = {
      accuracy: 0.85, // Placeholder - would be calculated based on validation
      complexity: process.steps.length / this.processConfig.maxStepsPerStrategy,
      efficiency: tokensPerSecond / 100, // Normalized
      novelty: 0.7 // Placeholder - would be calculated based on similarity to past solutions
    };

    // Generate recommendations
    const recommendations: string[] = [];

    if (averageTokensPerStep > 200) {
      recommendations.push('Consider breaking down steps into smaller units');
    }

    if (process.steps.length >= this.processConfig.maxStepsPerStrategy) {
      recommendations.push('Process is reaching step limit, consider optimization');
    }

    if (tokensPerSecond < 50) {
      recommendations.push('Process efficiency could be improved');
    }

    return {
      processId,
      metrics,
      recommendations
    };
  }

  async performThinkingMaintenance(): Promise<number> {
    let cleanedItems = 0;

    try {
      // Clean up old processes
      const now = Date.now();
      const ONE_WEEK = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

      for (const [processId, process] of this.activeProcesses.entries()) {
        if (now - process.startTime > ONE_WEEK) {
          this.activeProcesses.delete(processId);
          cleanedItems++;
        }
      }

      // Clean up old history files
      const files = await fs.promises.readdir(THINKING_DIR);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(THINKING_DIR, file);
        const stats = await fs.promises.stat(filePath);

        if (now - stats.mtimeMs > ONE_WEEK) {
          await fs.promises.unlink(filePath);
          cleanedItems++;
        }
      }

      return cleanedItems;
    } catch (error) {
      console.error('Error performing thinking maintenance:', error);
      return 0;
    }
  }

  async updateProcessConfig(config: Partial<ProcessConfig>): Promise<void> {
    this.processConfig = {
      ...this.processConfig,
      ...config
    };
  }

  getProcessConfig(): ProcessConfig {
    return { ...this.processConfig };
  }

  private selectThinkingModel(
    requestedModel: string | undefined,
    problem: string
  ): ThinkingModel {
    // Ensure thinkingModels array exists and has models
    if (!this.config.core.thinkingModels?.length) {
      console.warn('No thinking models configured, using default model');
      return this.config.defaultModel;
    }

    // Try to find requested model if specified
    if (requestedModel) {
      const model = this.config.core.thinkingModels.find(m => m.name === requestedModel);
      if (model) {
        return model;
      }
      console.warn(`Requested thinking model "${requestedModel}" not found, using complexity-based selection`);
    }

    // Auto-select based on problem complexity with safe fallbacks
    const complexity = this.assessProblemComplexity(problem);
    let selectedModel: ThinkingModel | undefined;
    
    if (complexity > 0.8) {
      selectedModel = this.config.core.thinkingModels.find(m => m.name === 'depth_first');
    } else if (complexity > 0.5) {
      selectedModel = this.config.core.thinkingModels.find(m => m.name === 'strategic');
    } else if (complexity > 0.3) {
      selectedModel = this.config.core.thinkingModels.find(m => m.name === 'breadth_first');
    } else {
      selectedModel = this.config.core.thinkingModels.find(m => m.name === 'minimal');
    }

    // If no model was found through complexity selection, use default model
    if (!selectedModel) {
      console.warn('No matching model found for complexity level, using default model');
      selectedModel = this.config.defaultModel;
    }

    return selectedModel;
  }

  private assessProblemComplexity(problem: string): number {
    // Simple complexity assessment based on problem characteristics
    let complexity = 0;

    // Length-based complexity
    complexity += Math.min(0.3, problem.length / 1000);

    // Keyword-based complexity
    const complexityKeywords = [
      'algorithm',
      'optimize',
      'design',
      'architecture',
      'performance',
      'scale',
      'system',
      'concurrent',
      'distributed'
    ];

    const keywordCount = complexityKeywords.reduce(
      (count, keyword) => count + (problem.toLowerCase().includes(keyword) ? 1 : 0),
      0
    );
    complexity += keywordCount * 0.1;

    // Structure-based complexity
    if (problem.includes('?')) complexity += 0.1;
    if (problem.includes('if')) complexity += 0.1;
    if (problem.includes('when')) complexity += 0.1;

    return Math.min(1, complexity);
  }

  private async storeProcessHistory(process: {
    processId: string;
    problem: string;
    model: string;
    steps: ThinkingStep[];
    duration: number;
    timestamp: string;
    error?: string;
  }): Promise<void> {
    try {
      const filePath = path.join(THINKING_DIR, `${process.processId}.json`);
      await fs.promises.writeFile(filePath, JSON.stringify(process, null, 2));
    } catch (error) {
      console.error('Error storing process history:', error);
    }
  }

  /**
   * Integrate code analysis with thinking process
   */
  private async integrateCodeAnalysis(context: any): Promise<any> {
    try {
      // Extract code snippets from context
      const codeSnippets = this.extractCodeSnippets(context);
      const analysisResults = [];

      for (const snippet of codeSnippets) {
        const processor = new MCPProcessor(context.systemContext || '', snippet.code);
        const recommendations = await processor.analyzeCode();
        
        analysisResults.push({
          location: snippet.location,
          recommendations: recommendations.getFileChanges()
        });
      }

      return {
        hasCodeSuggestions: analysisResults.some(result => result.recommendations.length > 0),
        analysisResults
      };
    } catch (error) {
      console.error('Error in code analysis integration:', error);
      return {
        hasCodeSuggestions: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Extract code snippets from context
   */
  private extractCodeSnippets(context: any): Array<{ location: string, code: string }> {
    const snippets = [];

    // Handle different types of code context
    if (context.fileContent) {
      snippets.push({
        location: context.filePath || 'unknown',
        code: context.fileContent
      });
    }

    if (context.codeBlocks && Array.isArray(context.codeBlocks)) {
      snippets.push(...context.codeBlocks.map((block: any) => ({
        location: block.location || 'inline',
        code: block.content
      })
      ));
    }

    // Extract code from markdown-style code blocks
    if (typeof context.content === 'string') {
      const codeBlockRegex = /```(?:\w+)?\n([\s\S]+?)\n```/g;
      let match;
      while ((match = codeBlockRegex.exec(context.content)) !== null) {
        snippets.push({
          location: 'markdown-block',
          code: match[1]
        });
      }
    }

    return snippets;
  }

  /**
   * Process thinking with integrated code analysis
   */
  async processThinking(request: any): Promise<LocalThinkingResult> {
    // Initialize thinking result with proper types
    const thinkingResult: LocalThinkingResult = {
      insights: [],
      metrics: {}
    };

    // Integrate code analysis if appropriate
    if (this.shouldAnalyzeCode(request)) {
      const codeAnalysis = await this.integrateCodeAnalysis(request.context);
      
      if (codeAnalysis.hasCodeSuggestions) {
        // Transform code suggestions into thinking insights
        const codeSuggestions = this.transformCodeSuggestions(codeAnalysis.analysisResults);
        
        // Integrate with thinking results
        thinkingResult.insights.push(...codeSuggestions);
        
        // Add code-specific metrics
        thinkingResult.metrics.codeAnalysis = {
          suggestionsCount: codeSuggestions.length,
          filesAnalyzed: codeAnalysis.analysisResults.length
        };
      }
    }

    return thinkingResult;
  }

  /**
   * Transform code analysis results into thinking insights
   */
  private transformCodeSuggestions(analysisResults: any[]): ThinkingInsight[] {
    return analysisResults.flatMap(result =>
      (result.recommendations || []).flatMap((rec: any) =>
        // Each recommendation from getFileChanges() has a changes array
        // that contains the actual CodeChange objects with replacement and explanation
        (rec.changes || []).map((change: any) => ({
          type: 'code_suggestion',
          location: result.location,
          suggestion: change.replacement,
          reasoning: change.explanation,
          confidence: 0.8,
          category: 'implementation'
        }))
      )
    );
  }

  /**
   * Determine if code analysis should be performed
   */
  private shouldAnalyzeCode(request: any): boolean {
    const codeIndicators = [
      'code',
      'implementation',
      'function',
      'class',
      'method',
      'bug',
      'error',
      'performance',
      'refactor'
    ];

    // Check request properties for code-related terms
    const checkText = (text: string | undefined): boolean =>
      Boolean(text && codeIndicators.some(indicator => 
        text.toLowerCase().includes(indicator)
      ));

    return (
      checkText(request.problem) ||
      checkText(request.context?.content) ||
      Boolean(request.context?.fileContent) ||
      (Array.isArray(request.context?.codeBlocks) && request.context.codeBlocks.length > 0)
    );
  }
}