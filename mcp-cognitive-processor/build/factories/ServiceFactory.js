import { ThinkingServiceImpl } from '../services/ThinkingServiceImpl.js';
import { TokenOptimizerImpl } from '../utils/TokenOptimizerImpl.js';
import { MemoryServiceAdapter } from '../adapters/MemoryServiceAdapter.js';
import { CacheServiceAdapter } from '../adapters/CacheServiceAdapter.js';
import { StandardThinkingStrategy } from '../strategies/StandardThinkingStrategy.js';
import { MinimalThinkingStrategy } from '../strategies/MinimalThinkingStrategy.js';
import { GeminiServiceOpenAI } from '../services/GeminiServiceOpenAI.js';
import { ClaudeServiceAdapter } from '../services/ClaudeServiceAdapter.js';
import { DeepSeekServiceAdapter } from '../services/DeepSeekServiceAdapter.js';
import { GoogleFlashServiceAdapter } from '../services/GoogleFlashServiceAdapter.js';
import { OpenRouterService } from '../services/OpenRouterService.js';
import { O1MiniService } from '../services/O1MiniService.js';
import { ProcessingPipelineOrchestrator } from '../services/ProcessingPipelineOrchestrator.js';
import { ModelFallbackService } from '../services/ModelFallbackService.js';
export class ServiceFactory {
    static cacheService;
    static memoryService;
    static thinkingService;
    static tokenOptimizer;
    static geminiService;
    static claudeService;
    static defaultService;
    static deepSeekService;
    static googleFlashService;
    static o1MiniService;
    static processingPipelineOrchestrator;
    constructor() { }
    static getCacheService() {
        if (!this.cacheService) {
            this.cacheService = new CacheServiceAdapter();
        }
        return this.cacheService;
    }
    static getMemoryService() {
        if (!this.memoryService) {
            this.memoryService = new MemoryServiceAdapter();
        }
        return this.memoryService;
    }
    static getGeminiService(apiKey) {
        if (!this.geminiService) {
            if (!apiKey) {
                throw new Error('OPENROUTER_API_KEY is required');
            }
            // Use the new OpenAI SDK based implementation
            this.geminiService = new GeminiServiceOpenAI(apiKey);
            console.log('Created GeminiServiceOpenAI instance with OpenAI SDK');
        }
        return this.geminiService;
    }
    static getClaudeService() {
        if (!this.claudeService) {
            const apiKey = process.env.CLAUDE_API_KEY;
            if (!apiKey) {
                throw new Error('CLAUDE_API_KEY environment variable not set');
            }
            // Use getInstance() instead of direct instantiation as the constructor is private
            this.claudeService = ClaudeServiceAdapter.getInstance(apiKey);
        }
        return this.claudeService;
    }
    static getDefaultService() {
        if (!this.defaultService) {
            const apiKey = process.env.OPENROUTER_API_KEY;
            if (!apiKey) {
                throw new Error('OPENROUTER_API_KEY environment variable not set');
            }
            this.defaultService = this.getGeminiService(apiKey);
        }
        return this.defaultService;
    }
    static getThinkingService(config) {
        if (!this.thinkingService) {
            const tokenOptimizer = this.getTokenOptimizer();
            // Use Gemini Pro 2 via OpenRouter
            const geminiService = this.getGeminiService(process.env.OPENROUTER_API_KEY || '');
            this.thinkingService = new ThinkingServiceImpl(this, tokenOptimizer, config, geminiService);
        }
        return this.thinkingService;
    }
    static createThinkingStrategy(model) {
        switch (model.name) {
            case 'standard':
                return new StandardThinkingStrategy(model, this.getTokenOptimizer());
            case 'minimal':
                return new MinimalThinkingStrategy(model, this.getTokenOptimizer());
            default:
                return new StandardThinkingStrategy(model, this.getTokenOptimizer());
        }
    }
    static getTokenOptimizer() {
        if (!this.tokenOptimizer) {
            this.tokenOptimizer = TokenOptimizerImpl.getInstance();
        }
        return this.tokenOptimizer;
    }
    static getDeepSeekService() {
        if (!this.deepSeekService) {
            const apiKey = process.env.DEEPSEEK_API_KEY;
            if (!apiKey) {
                throw new Error('DEEPSEEK_API_KEY environment variable not set');
            }
            this.deepSeekService = DeepSeekServiceAdapter.getInstance(apiKey);
        }
        return this.deepSeekService;
    }
    static getGoogleFlashService() {
        if (!this.googleFlashService) {
            // Use OpenRouter API key instead of Google API key since we're now using OpenRouter for all models
            const apiKey = process.env.OPENROUTER_API_KEY;
            if (!apiKey) {
                throw new Error('OPENROUTER_API_KEY environment variable not set');
            }
            this.googleFlashService = new GoogleFlashServiceAdapter(apiKey);
            console.log('Created GoogleFlashServiceAdapter using OpenRouter');
        }
        return this.googleFlashService;
    }
    static getO1MiniService() {
        if (!this.o1MiniService) {
            const apiKey = process.env.OPENROUTER_API_KEY;
            if (!apiKey) {
                throw new Error('OPENROUTER_API_KEY environment variable not set');
            }
            this.o1MiniService = new O1MiniService(apiKey);
        }
        return this.o1MiniService;
    }
    static getProcessingPipelineOrchestrator() {
        // Always create a new orchestrator to ensure fresh pipeline with isolated step instances
        console.log('Creating new ProcessingPipelineOrchestrator with isolated service instances');
        // Create orchestrator with debug mode
        this.processingPipelineOrchestrator = new ProcessingPipelineOrchestrator(true);
        // Create fresh service instances for each step to ensure they make separate API calls
        console.log('Creating isolated service instances for each pipeline step');
        // Create new service instances for each step (not reusing existing ones)
        const apiKey = process.env.OPENROUTER_API_KEY || '';
        // Step 1: Create a ModelFallbackService with GoogleFlashServiceAdapter as primary and O1Mini as backup
        console.log('Step 1: Creating ModelFallbackService with Gemini Flash (primary) and O1Mini (backup)');
        // Create the primary service (Google Flash)
        const googleFlashService = new GoogleFlashServiceAdapter(apiKey);
        // Create the backup service (O1Mini)
        const o1MiniService = new O1MiniService(apiKey);
        // Create a fallback service for step 1 using getInstance (singleton pattern)
        const fallbackService = ModelFallbackService.getInstance({
            timeout: 20000, // 20 second timeout
            maxRetries: 2, // 2 retries max
            healthCheckInterval: 60000 // Check every minute
        });
        // Register providers with the fallback service (Google Flash as primary, O1Mini as backup)
        fallbackService.registerProvider('gemini-flash', googleFlashService, 2, 1.0); // Higher priority for primary
        fallbackService.registerProvider('o1-mini', o1MiniService, 1, 0.8); // Lower priority for backup
        console.log('Successfully created fallback service for step 1 with Gemini Flash and O1Mini');
        // Step 2: Create a dedicated OpenRouter instance for Gemini Pro
        console.log('Step 2: Creating dedicated OpenRouterService instance for Gemini Pro');
        const geminiService = OpenRouterService.getInstance(apiKey, {
            model: 'google/gemini-2.0-pro-exp-02-05:free'
        });
        // Step 3: Create a dedicated DeepSeek instance
        console.log('Step 3: Creating dedicated DeepSeekServiceAdapter instance');
        const deepSeekService = DeepSeekServiceAdapter.getInstance(apiKey, 'deepseek/deepseek-r1:free');
        // Add steps with their corresponding service instances
        console.log('Adding step 1: Flash Preprocessing with fallback to O1Mini');
        this.processingPipelineOrchestrator.addStep({
            name: 'Flash Preprocessing',
            service: fallbackService,
            model: 'google/gemini-2.0-flash-exp-02-05:free',
            systemPrompt: `You are a fast preprocessing agent in a three-step processing pipeline.
Your specific role is STEP 1 - INITIAL PREPROCESSING:
- Start your response with "STEP 1 ANALYSIS:"
- Extract key information and entities from the input
- Identify main themes, topics, and sentiment
- Structure the information in a clear, organized format
- Prepare the content for more in-depth analysis by the next step
- Focus on breadth rather than depth
- Be comprehensive but concise
- Your output will be passed to an Advanced Processing agent`,
            temperature: 0.5,
            maxTokens: 1500
        });
        console.log('Adding step 2: Advanced Processing with isolated Gemini service');
        this.processingPipelineOrchestrator.addStep({
            name: 'Advanced Processing',
            service: geminiService,
            model: 'google/gemini-2.0-pro-exp-02-05:free',
            systemPrompt: `You are an advanced processing agent in a three-step pipeline.
Your specific role is STEP 2 - ADVANCED PROCESSING:
- Start your response with "STEP 2 ANALYSIS:"
- Review and build upon the analysis from step 1
- Perform detailed analysis on the structured information
- Identify patterns, relationships, and connections
- Evaluate complexities and nuances in the content
- Add depth and context to the initial preprocessing
- Prepare a sophisticated analysis for the final reasoning step
- Your output will be passed to a Preliminary Reasoning agent`,
            temperature: 0.7,
            maxTokens: 2000
        });
        console.log('Adding step 3: Preliminary Reasoning with isolated DeepSeek service');
        this.processingPipelineOrchestrator.addStep({
            name: 'Preliminary Reasoning',
            service: deepSeekService,
            model: 'deepseek/deepseek-r1:free',
            systemPrompt: `You are a reasoning agent in a three-step pipeline, performing the final analysis.
Your specific role is STEP 3 - PRELIMINARY REASONING:
- Start your response with "STEP 3 ANALYSIS:"
- Critically evaluate the analysis from steps 1 and 2
- Apply logical reasoning and analytical thinking
- Draw conclusions based on the processed information
- Consider implications, consequences, and alternatives
- Synthesize insights into a cohesive final analysis
- Generate the definitive output that incorporates all previous processing
- Your output is the final result of the entire pipeline`,
            temperature: 0.3,
            maxTokens: 3000
        });
        return this.processingPipelineOrchestrator;
    }
    static getDefaultConfig() {
        return {
            name: "Masterful Cognitive Processor",
            version: "1.0.0",
            description: "A cognitive processor for advanced reasoning and problem solving.",
            defaultModel: { name: "standard" },
            maxStepsPerStrategy: 10,
            tokenBudget: 1000,
            optimizationThreshold: 0.7,
            memoryPath: './data/memory',
            cachePath: './data/cache',
            core: {
                thinkingModels: [
                    { name: "strategic", description: "Strategic Thinking Model" },
                    { name: "depth_first", description: "Depth-First Thinking Model" },
                    { name: "breadth_first", description: "Breadth-First Thinking Model" },
                    { name: "minimal", description: "Minimal Thinking Model" }
                ],
                intelligence: {
                    reasoningSystems: [
                        { name: "tree_of_thought", description: "Tree of Thoughts Reasoning", implementation: "TreeOfThoughtsStrategy" },
                        { name: "chain_of_thought", description: "Chain of Thought Reasoning", implementation: "ChainOfThoughtStrategy" },
                        { name: "parallel_thought", description: "Parallel Thought Reasoning", implementation: "ParallelThoughtStrategy" }
                    ],
                    abstractionLevels: [
                        { name: "high", focus: "Conceptual and strategic thinking" },
                        { name: "medium", focus: "Implementation and tactical thinking" },
                        { name: "low", focus: "Operational and detailed thinking" }
                    ]
                }
            },
            stepByStepThinking: {
                enabled: true,
                documentationLevel: "high",
                components: [
                    {
                        name: "Problem Analysis",
                        description: "Analyze the problem to understand its components and requirements.",
                        capabilities: [
                            { name: 'Component Identification', description: 'Identify and categorize key components of the problem.' },
                            { name: 'Dependency Analysis', description: 'Analyze dependencies between components.' }
                        ]
                    },
                    {
                        name: "Solution Synthesis",
                        description: "Synthesize potential solutions based on the problem analysis.",
                        capabilities: [
                            { name: 'Solution Generation', description: 'Generate potential solutions.' },
                            { name: 'Solution Evaluation', description: 'Evaluate the quality and feasibility of solutions.' }
                        ]
                    }
                ]
            },
            memory: {
                systemType: 'file',
                components: [
                    {
                        name: 'Working Memory',
                        description: 'Short-term memory for active processing.',
                        capacity: 'limited',
                        persistenceLevel: 'session'
                    },
                    {
                        name: 'Episodic Memory',
                        description: 'Memory for specific events and experiences.',
                        capacity: 'large',
                        persistenceLevel: 'long-term'
                    }
                ]
            },
            preprocessingPipeline: {
                enabled: true,
                gemini: {
                    model: 'gemini-pro',
                    temperature: 0.7,
                    maxTokens: 1000,
                    topP: 0.8
                },
                claude: {
                    model: 'claude-2.1',
                    temperature: 0.5,
                    maxTokens: 2048
                },
                pipelineSteps: [
                    {
                        name: 'Initial Analysis',
                        description: 'Gemini analyzes query structure and extracts key components',
                        service: 'gemini',
                        priority: 1
                    },
                    {
                        name: 'Deep Reasoning',
                        description: 'Claude performs detailed analysis and generates comprehensive solutions',
                        service: 'claude',
                        priority: 2
                    }
                ]
            }
        };
    }
    static createDefaultConfig() {
        return {
            name: "Masterful Cognitive Processor",
            version: "1.0.0",
            description: "An advanced cognitive processing system",
            defaultModel: {
                name: "gemini-flash"
            },
            maxStepsPerStrategy: 10,
            tokenBudget: 10000,
            optimizationThreshold: 0.8,
            memoryPath: './data/memory',
            cachePath: './data/cache',
            core: {
                thinkingModels: [],
                intelligence: {
                    reasoningSystems: [],
                    abstractionLevels: []
                }
            },
            stepByStepThinking: {
                enabled: true,
                documentationLevel: 'detailed',
                components: []
            },
            memory: {
                systemType: 'hierarchical',
                components: []
            },
            preprocessingPipeline: {
                enabled: true,
                gemini: {
                    model: 'gemini-pro',
                    temperature: 0.7,
                    maxTokens: 1000
                },
                claude: {
                    model: 'claude-2.1',
                    temperature: 0.7,
                    maxTokens: 1500
                },
                pipelineSteps: [
                    {
                        name: 'initial-preprocessing',
                        description: 'Gemini Pro performs initial content preprocessing',
                        service: 'gemini',
                        priority: 1
                    },
                    {
                        name: 'advanced-analysis',
                        description: 'Claude performs detailed analysis and generates comprehensive solutions',
                        service: 'claude',
                        priority: 2
                    }
                ]
            }
        };
    }
}
//# sourceMappingURL=ServiceFactory.js.map