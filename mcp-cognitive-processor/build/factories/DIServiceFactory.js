import { Container } from '../core/Container.js';
import { ConfigurationService } from '../services/ConfigurationService.js';
import { HealthMonitoringService } from '../services/HealthMonitoringService.js';
import { CachingService } from '../services/CachingService.js';
import { ModelFallbackService } from '../services/ModelFallbackService.js';
import { GeminiServiceOpenAI } from '../services/GeminiServiceOpenAI.js';
import { ClaudeServiceAdapter } from '../services/ClaudeServiceAdapter.js';
import { ThinkingServiceImpl } from '../services/ThinkingServiceImpl.js';
import { TokenOptimizerImpl } from '../utils/TokenOptimizerImpl.js';
import { ServiceFactory } from './ServiceFactory.js';
import { MemoryServiceAdapter } from '../adapters/MemoryServiceAdapter.js';
import * as cacheServiceUtils from '../services/cacheService.js';
import { ProcessingPipelineOrchestrator } from '../services/ProcessingPipelineOrchestrator.js';
export class DIServiceFactory {
    static container = Container.getInstance();
    static async initialize(config) {
        console.log('Checking OPENROUTER_API_KEY');
        console.log('Checking OPENROUTER_API_KEY');
        // Verify OpenRouter API key is available
        if (!process.env.OPENROUTER_API_KEY) {
            console.error('OPENROUTER_API_KEY is not set in environment variables');
            throw new Error('OPENROUTER_API_KEY is required for initialization');
            console.log('OPENROUTER_API_KEY check passed');
        }
        console.log('OPENROUTER_API_KEY check passed');
        // Initialize Configuration Service
        // Try using environment-specific config path
        const configPath = process.env.MCP_CONFIG_PATH || './mcp-settings.json';
        const configService = new ConfigurationService(configPath);
        console.log(`Using config path: ${configPath}`);
        console.log('configService initialized:', configService.getConfig());
        // Update config after service creation
        if (config) {
            console.log('configService initialized:', configService.getConfig());
            configService.updateConfig(config);
        }
        this.container.register('configService', configService);
        // Initialize Health Monitoring
        const healthMonitoring = HealthMonitoringService.getInstance();
        this.container.register('healthMonitoring', healthMonitoring);
        // Initialize Memory Service
        const memoryAdapter = new MemoryServiceAdapter();
        this.container.register('memoryService', memoryAdapter);
        // Initialize Caching Service
        const cachingService = CachingService.getInstance({
            backend: 'file',
            persistPath: './data/cache/service-cache.json'
        });
        await new Promise(resolve => setTimeout(resolve, 500)); // Add a 500ms delay
        this.container.register('cachingService', cachingService);
        // Initialize Cache Service (separate from Caching Service)
        const cacheServiceInstance = cacheServiceUtils.default;
        this.container.register('cacheService', cacheServiceInstance);
        console.log('Registered cacheService in container');
        // Initialize Token Optimizer
        const tokenOptimizer = TokenOptimizerImpl.getInstance();
        this.container.register('tokenOptimizer', tokenOptimizer);
        // Initialize Model Services
        this.initializeAIServices();
        // Initialize Model Fallback Service (depends on AI services)
        this.initializeModelFallback();
        // Initialize Thinking Service with dependencies (depends on AI services)
        this.initializeThinkingService();
    }
    /**
     * Initialize AI services including Gemini and Claude
     */
    static initializeAIServices() {
        console.log('*** DEBUG: Starting initializeAIServices ***');
        try {
            // Initialize Gemini service with OpenRouter
            const openRouterApiKey = process.env.OPENROUTER_API_KEY;
            console.log('*** DEBUG: OpenRouter API Key available:', !!openRouterApiKey);
            console.log('Initializing Gemini service with OpenRouter key');
            // Register GeminiServiceOpenAI for backward compatibility
            console.log('*** DEBUG: Creating GeminiServiceOpenAI instance...');
            const geminiService = new GeminiServiceOpenAI(openRouterApiKey);
            console.log('*** DEBUG: GeminiServiceOpenAI instance created');
            console.log('*** DEBUG: Registering geminiService in container...');
            this.container.register('geminiService', geminiService);
            console.log('*** DEBUG: Container has geminiService after registration:', this.container.has('geminiService'));
            console.log('Gemini service registered successfully');
            // Initialize OpenRouter services with specific model configurations
            this.initializeOpenRouterServices(openRouterApiKey);
            // Initialize Claude service only if API key is available
            const claudeApiKey = process.env.CLAUDE_API_KEY;
            if (claudeApiKey) {
                console.log('Initializing Claude service with API key');
                const claudeService = ClaudeServiceAdapter.getInstance(claudeApiKey, 'claude-3-opus-20240229');
                this.container.register('claudeService', claudeService);
                console.log('Claude service registered successfully');
            }
            else {
                console.log('No Claude API key found, skipping Claude service initialization');
            }
            // Initialize the Processing Pipeline Orchestrator
            this.initializeProcessingPipeline();
        }
        catch (error) {
            console.error('Error initializing AI services:', error);
            throw error; // Re-throw to prevent continuing with initialization
        }
    }
    /**
     * Initialize OpenRouter services with specific model configurations
     * Each service is a separate instance of OpenRouterService with its own model
     */
    static async initializeOpenRouterServices(apiKey) {
        console.log('Initializing OpenRouter services for all models');
        try {
            // Import the OpenRouterService dynamically
            const { OpenRouterService } = await import('../services/OpenRouterService.js');
            // Create the Gemini Pro service
            const geminiConfig = {
                timeoutMs: 60000,
                maxRetries: 3,
                retryDelayMs: 2000,
                adaptiveTimeout: true,
                model: 'google/gemini-2.0-pro-exp-02-05:free'
            };
            const geminiProService = OpenRouterService.getInstance(apiKey, geminiConfig);
            this.container.register('geminiProService', geminiProService);
            console.log('Gemini Pro service registered successfully');
            // Create the DeepSeek service
            const deepseekConfig = {
                timeoutMs: 90000, // Longer timeout for coding tasks
                maxRetries: 2,
                retryDelayMs: 2000,
                adaptiveTimeout: true,
                model: 'deepseek/deepseek-coder-v2'
            };
            const deepseekService = OpenRouterService.getInstance(apiKey, deepseekConfig);
            this.container.register('deepSeekService', deepseekService);
            console.log('DeepSeek service registered successfully');
            // Create the Google Flash service
            const flashConfig = {
                timeoutMs: 30000, // Shorter timeout for faster model
                maxRetries: 2,
                retryDelayMs: 1000,
                adaptiveTimeout: true,
                model: 'google/gemini-2.0-flash-exp-02-05:free'
            };
            const googleFlashService = OpenRouterService.getInstance(apiKey, flashConfig);
            this.container.register('googleFlashService', googleFlashService);
            console.log('Google Flash service registered successfully');
            // Add Deepseek R1 configuration
            const deepseekR1Config = {
                timeoutMs: 90000,
                maxRetries: 3,
                retryDelayMs: 2000,
                adaptiveTimeout: true,
                model: 'deepseek/deepseek-r1:free'
            };
            const deepseekR1Service = OpenRouterService.getInstance(apiKey, deepseekR1Config);
            this.container.register('deepseekR1Service', deepseekR1Service);
            console.log('Deepseek R1 service registered successfully');
            // Create an OpenRouter service for Claude (if needed through OpenRouter)
            const claudeConfig = {
                timeoutMs: 120000, // Longer timeout for final reasoning
                maxRetries: 3,
                retryDelayMs: 2000,
                adaptiveTimeout: true,
                model: 'anthropic/claude-3-opus-20240229'
            };
            const claudeOpenRouterService = OpenRouterService.getInstance(apiKey, claudeConfig);
            this.container.register('claudeOpenRouterService', claudeOpenRouterService);
            console.log('Claude OpenRouter service registered successfully');
        }
        catch (error) {
            console.error('Error initializing OpenRouter services:', error);
            throw error;
        }
    }
    /**
     * Initialize the Processing Pipeline Orchestrator
     * Sets up the sequential processing pipeline with all model steps
     */
    static initializeProcessingPipeline() {
        console.log('Initializing Processing Pipeline Orchestrator');
        try {
            // Create pipeline orchestrator with debug mode enabled
            const pipelineOrchestrator = new ProcessingPipelineOrchestrator(true);
            // Get service instances
            const googleFlashService = this.container.get('googleFlashService');
            const geminiProService = this.container.get('geminiProService');
            const deepSeekService = this.container.get('deepSeekService');
            // Try to get Claude service (from direct API or OpenRouter)
            let claudeService;
            if (this.container.has('claudeService')) {
                claudeService = this.container.get('claudeService');
                console.log('Using direct Claude API for pipeline');
            }
            else if (this.container.has('claudeOpenRouterService')) {
                claudeService = this.container.get('claudeOpenRouterService');
                console.log('Using OpenRouter Claude service for pipeline');
            }
            else {
                // Fallback to Gemini Pro if Claude is not available
                claudeService = geminiProService;
                console.log('Claude service not available, using Gemini Pro as fallback for final step');
            }
            // Add steps to the pipeline in sequential order
            pipelineOrchestrator.addStep({
                name: 'Initial Fast Processing',
                service: googleFlashService,
                model: 'google/gemini-2.0-flash-exp-02-05:free',
                systemPrompt: 'You are a fast preprocessing agent. Extract key information from the input and organize it clearly, focusing on the most relevant details.',
                temperature: 0.5,
                maxTokens: 1500
            });
            pipelineOrchestrator.addStep({
                name: 'Advanced Preprocessing',
                service: geminiProService,
                model: 'google/gemini-2.0-pro-exp-02-05:free',
                systemPrompt: 'You are an advanced preprocessing agent. Analyze the input thoroughly, identify patterns, and structure the information in a way that will be optimal for deep reasoning in the next step.',
                temperature: 0.7,
                maxTokens: 2000
            });
            pipelineOrchestrator.addStep({
                name: 'Deep Reasoning',
                service: deepSeekService,
                model: 'deepseek/deepseek-coder-v2',
                systemPrompt: 'You are an expert reasoning agent specialized in deep technical analysis. Your task is to perform complex reasoning on the input data, identify implications, and generate insights that could be missed by simpler analysis.',
                temperature: 0.3,
                maxTokens: 3000
            });
            pipelineOrchestrator.addStep({
                name: 'Final Integration',
                service: claudeService,
                model: claudeService === geminiProService ? 'google/gemini-2.0-pro-exp-02-05:free' : 'anthropic/claude-3-opus-20240229',
                systemPrompt: 'You are a final integration agent. Your task is to synthesize all the analysis provided, create a cohesive narrative, and present a comprehensive response that addresses all aspects of the original query.',
                temperature: 0.7,
                maxTokens: 4000
            });
            // Register the pipeline orchestrator in the container
            this.container.register('processingPipeline', pipelineOrchestrator);
            console.log('Processing Pipeline Orchestrator initialized successfully with 4 steps');
        }
        catch (error) {
            console.error('Error initializing Processing Pipeline Orchestrator:', error);
        }
    }
    static initializeModelFallback() {
        const fallbackService = ModelFallbackService.getInstance({
            timeout: 30000,
            maxRetries: 3,
            healthCheckInterval: 60000
        });
        console.log('Initializing model fallback service...');
        // Only include services we know are registered
        const registeredServices = {
            geminiService: { priority: 2, weight: 1.0 }
        };
        // Conditionally add Claude if available
        if (this.container.has('claudeService')) {
            registeredServices.claudeService = { priority: 1, weight: 0.8 };
        }
        // Conditionally add DeepSeek if available
        if (this.container.has('deepSeekService')) {
            registeredServices.deepSeekService = { priority: 0, weight: 0.9 };
        }
        // Conditionally add Google Flash if available
        if (this.container.has('googleFlashService')) {
            registeredServices.googleFlashService = { priority: 1, weight: 0.9 };
        }
        // Log available services
        console.log(`Available services for fallback: ${Object.keys(registeredServices).join(', ')}`);
        // Register available AI services with fallback service
        Object.entries(registeredServices).forEach(([name, config]) => {
            try {
                if (!this.container.has(name)) {
                    console.log(`Service ${name} not available, skipping fallback registration`);
                    return;
                }
                const service = this.container.get(name);
                if (this.isAIService(service)) {
                    fallbackService.registerProvider(name, service, config.priority, config.weight);
                    console.log(`Registered ${name} with fallback service successfully`);
                }
                else {
                    console.warn(`Service ${name} does not implement IAIService interface`);
                }
            }
            catch (error) {
                console.warn(`Could not register ${name} with fallback service:`, error);
            }
        });
        this.container.register('modelFallbackService', fallbackService);
        console.log('Model fallback service initialized');
    }
    static initializeThinkingService() {
        const config = this.container.get('configService').getConfig();
        const tokenOptimizer = this.container.get('tokenOptimizer');
        // Get the Gemini service
        let aiService;
        try {
            aiService = this.container.get('geminiService');
            console.log('Using Gemini service for thinking service');
        }
        catch (error) {
            console.error('Failed to get Gemini service:', error);
            throw new Error('AI service initialization failed - Gemini service is required');
        }
        // Create ThinkingService directly with ServiceFactory static methods
        const thinkingService = new ThinkingServiceImpl(ServiceFactory, // Pass ServiceFactory class directly
        tokenOptimizer, config, aiService);
        this.container.register('thinkingService', thinkingService);
    }
    static getService(name) {
        return this.container.get(name);
    }
    /**
     * Check if a service exists in the container
     * @param name The name of the service to check
     * @returns True if the service exists, false otherwise
     */
    static hasService(name) {
        return this.container.has(name);
    }
    // Type guard to check if a service implements IAIService
    static isAIService(service) {
        return typeof service === 'object' && service !== null &&
            typeof service.query === 'function';
    }
    // Factory methods for creating specific services
    static createThinkingStrategy(model) {
        return ServiceFactory.createThinkingStrategy(model);
    }
}
//# sourceMappingURL=DIServiceFactory.js.map