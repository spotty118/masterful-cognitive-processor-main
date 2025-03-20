#!/usr/bin/env node
/**
 * Main entry point for the Masterful Cognitive Processor
 */
// Load environment variables from .env file
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Get current directory path in ESM
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

// Look for .env file in current directory and parent directories
const envResult = dotenv.config({ path: path.resolve(__dirname, '../.env') });
console.log('Trying to load .env from:', path.resolve(__dirname, '../.env'));

if (envResult.error) {
  console.warn('Failed to load .env file from expected path, trying current directory...');
  // Try to load from current directory
  const currentEnvPath = path.resolve(process.cwd(), '.env');
  console.log('Trying to load .env from:', currentEnvPath);
  if (fs.existsSync(currentEnvPath)) {
    dotenv.config({ path: currentEnvPath });
    console.log('Loaded .env file from current directory');
  } else {
    console.warn('No .env file found. Environment variables must be set manually.');
  }
} else {
  console.log('Successfully loaded .env file');
}

// Log environment variable status (without exposing the actual key)
console.log('OPENROUTER_API_KEY status:', process.env.OPENROUTER_API_KEY ? 'Set' : 'Not set');

// Validate critical environment variable is present
const envValidation = {
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || ''
};

console.log('Environment validation:');
Object.entries(envValidation).forEach(([key, value]) => {
  // Don't log the full API key value, just whether it's set or not
  if (key.includes('API_KEY')) {
    console.log(`- ${key}: ${value ? 'SET' : 'NOT SET'} (${value ? value.length : 0} chars)`);
  } else {
    console.log(`- ${key}: ${value}`);
  }
});

import { mcpConfig } from './config/mcp-config.js';
import { TokenOptimizerImpl } from './utils/TokenOptimizerImpl.js';
import { ServiceFactory } from './factories/ServiceFactory.js';
import { ThinkingServiceImpl } from './services/ThinkingServiceImpl.js';
import { GeminiService } from './services/GeminiService.js';
import tokenHistoryService from './services/tokenHistoryService.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createHash } from 'crypto';
import { ThinkingEngine } from './core/ThinkingEngine.js';
import { MemoryManager } from './utils/MemoryManager.js';
import * as memoryServiceUtils from './services/memoryService.js';  // Renamed to avoid conflict
import * as cacheServiceUtils from './services/cacheService.js';    // Renamed to avoid conflict
import { processStructuredThinking } from './services/intelligenceService.js';
import * as thinkingServiceUtils from './services/thinkingService.js';  // Changed to import with namespace

// Initialize required directories
// Ensure we use a relative path for data directory if not already set
if (!process.env.MCP_DB_DIR) {
  process.env.MCP_DB_DIR = path.join(__dirname, '../data');
}
const DB_DIR = process.env.MCP_DB_DIR;
const directories = [
  path.join(DB_DIR, 'cache'),
  path.join(DB_DIR, 'memory'),
  path.join(DB_DIR, 'token_history'),
  path.join(DB_DIR, 'thinking'),
  path.join(DB_DIR, 'optimization')
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Initialize services
// Use static methods from ServiceFactory instead of creating an instance
// tokenOptimizer is already imported from './utils/tokenOptimizer'

// Create and configure the thinking service
// Initialize the token optimizer
const tokenOptimizer = TokenOptimizerImpl.getInstance();

// Initialize the token optimizer asynchronously
(async () => {
  try {
    await tokenOptimizer.init();
    console.log('Token optimizer initialized successfully');
  } catch (error) {
    console.error('Error initializing token optimizer:', error);
  }
})();

// Choose service based on environment variable
let thinkingService;
// Extract API key for clarity
const openRouterApiKey = process.env.OPENROUTER_API_KEY || '';

// Use Gemini Pro 2 via OpenRouter
console.log('Using Gemini Pro 2 via OpenRouter');
if (!openRouterApiKey) {
  console.warn('WARNING: OPENROUTER_API_KEY is not set. API calls will fail until this is configured.');
}

// Check if Gemini Flash fallback is enabled
const enableGeminiFlashFallback = process.env.ENABLE_GEMINI_FLASH_FALLBACK === 'true';

// Create GeminiService with fallback configuration
const geminiService = new GeminiService(
  openRouterApiKey,
  'pro', // Use Pro model by default 
  enableGeminiFlashFallback // Enable fallback to Flash if configured
);

if (enableGeminiFlashFallback) {
  console.log('Gemini Flash fallback is enabled');
}

// Create and configure the thinking service with GeminiService
thinkingService = new ThinkingServiceImpl(
  ServiceFactory,
  tokenOptimizer,
  mcpConfig,
  geminiService
);

console.log(`Initializing ${mcpConfig.name} v${mcpConfig.version}`);
console.log('Core capabilities:');
console.log('- Thinking Models:', mcpConfig.core.thinkingModels.map((m: { name: string }) => m.name).join(', '));
console.log('- Reasoning Systems:', mcpConfig.core.intelligence.reasoningSystems.map((r: { name: string }) => r.name).join(', '));

// Export the configured services
export {
  thinkingService,
  // Don't re-export tokenOptimizer to avoid circular dependencies
  tokenHistoryService,
  mcpConfig
};


/**
 * Main class for the MCP Cognitive Processor
 * Handles server setup and request routing
 */
class MCPCognitiveProcessor {
  private server: Server;
  
  /**
   * Constructor for MCPCognitiveProcessor
   * Sets up the server and request handlers
   */
  constructor() {
    // Create the server
    this.server = new Server(
      {
        name: 'cognitive-processor',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {
            list: true,
            templates: true,
            read: true
          },
          tools: {
            list: true,
            call: true
          },
        },
      }
    );
    
    // Set up request handlers
    this.setupResourceHandlers();
    this.setupToolHandlers();
    
    // Set up error handling
    this.server.onerror = (error: any) => console.error('[MCP Error]', error);
    
    // Handle process termination
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }
  
  /**
   * Sets up resource handlers for the server
   * @private
   */
  private setupResourceHandlers(): void {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'mcp://config/thinking-models',
          name: 'Thinking Models Configuration',
          description: 'Available thinking models and their configurations',
        },
        {
          uri: 'mcp://config/reasoning-systems',
          name: 'Reasoning Systems Configuration',
          description: 'Available reasoning systems and their implementations',
        },
        {
          uri: 'mcp://memory/stats',
          name: 'Memory System Statistics',
          description: 'Statistics about the memory system',
        },
        {
          uri: 'mcp://cache/stats',
          name: 'Cache System Statistics',
          description: 'Statistics about the cache system',
        },
      ],
    }));
    
    // List available resource templates
    this.server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({
      resourceTemplates: [
        {
          uriTemplate: 'mcp://memory/{type}',
          name: 'Memory items by type',
          description: 'Retrieve memory items of a specific type (working, episodic, semantic, procedural)',
        },
        {
          uriTemplate: 'mcp://memory/item/{id}',
          name: 'Memory item by ID',
          description: 'Retrieve a specific memory item by its ID',
        },
        {
          uriTemplate: 'mcp://cache/stats/{type}',
          name: 'Cache statistics by type',
          description: 'Statistics about a specific cache type',
        },
      ],
    }));
    
    // Handle resource reading
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request: any) => {
      const uri = request.params.uri;
      
      // Config resources
      if (uri === 'mcp://config/thinking-models') {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(mcpConfig.core.thinkingModels, null, 2),
            },
          ],
        };
      }
      
      if (uri === 'mcp://config/reasoning-systems') {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(mcpConfig.core.intelligence.reasoningSystems, null, 2),
            },
          ],
        };
      }
      
      // Memory resources
      if (uri === 'mcp://memory/stats') {
        const memoryService = ServiceFactory.getMemoryService();
        const items = await memoryService.retrieveMemory('', 1000); // Get all items
        
        const stats = {
          totalItems: items.length,
          byType: {
            working: items.filter((item: { id: string }) => item.id.includes('working')).length,
            episodic: items.filter((item: { id: string }) => item.id.includes('episodic')).length,
            semantic: items.filter((item: { id: string }) => item.id.includes('semantic')).length,
            procedural: items.filter((item: { id: string }) => item.id.includes('procedural')).length,
          },
        };
        
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(stats, null, 2),
            },
          ],
        };
      }
      
      // Cache resources
      if (uri === 'mcp://cache/stats') {
        const cacheService = ServiceFactory.getCacheService();
        const stats = await cacheService.getCacheStats();
        
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(stats, null, 2),
            },
          ],
        };
      }
      
      // Resource templates
      const memoryTypeMatch = uri.match(/^mcp:\/\/memory\/([^/]+)$/);
      if (memoryTypeMatch) {
        const type = memoryTypeMatch[1];
        const memoryService = ServiceFactory.getMemoryService();
        const items = await memoryService.retrieveMemory(type, 100);
        
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(items, null, 2),
            },
          ],
        };
      }
      
      const memoryItemMatch = uri.match(/^mcp:\/\/memory\/item\/([^/]+)$/);
      if (memoryItemMatch) {
        const id = memoryItemMatch[1];
        const memoryService = ServiceFactory.getMemoryService();
        const item = await memoryService.getMemoryById(id);
        
        if (!item) {
          throw new McpError(ErrorCode.InvalidRequest, `Memory item not found: ${id}`);
        }
        
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(item, null, 2),
            },
          ],
        };
      }
      
      const cacheStatsMatch = uri.match(/^mcp:\/\/cache\/stats\/([^/]+)$/);
      if (cacheStatsMatch) {
        const type = cacheStatsMatch[1];
        const cacheService = ServiceFactory.getCacheService();
        const stats = await cacheService.getCacheStats(type);
        
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(stats, null, 2),
            },
          ],
        };
      }
      
      throw new McpError(ErrorCode.InvalidRequest, `Resource not found: ${uri}`);
    });
  }
  
  /**
   * Sets up tool handlers for the server
   * @private
   */
  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'generate_with_mcp',
          description: 'Generate content using the Masterful Cognitive Processor',
          inputSchema: {
            type: 'object',
            properties: {
              prompt: {
                type: 'string',
                description: 'The prompt to process',
              },
              model: {
                type: 'string',
                description: 'The model to use (optional)',
              },
              max_tokens: {
                type: 'number',
                description: 'Maximum tokens to generate (optional)',
              },
              optimize_tokens: {
                type: 'boolean',
                description: 'Whether to optimize token usage (optional)',
              },
            },
            required: ['prompt'],
          },
        },
        {
          name: 'thinking_process',
          description: 'Execute a step-by-step thinking process',
          inputSchema: {
            type: 'object',
            properties: {
              problem: {
                type: 'string',
                description: 'The problem to solve',
              },
              thinking_model: {
                type: 'string',
                description: 'The thinking model to use (optional)',
              },
              include_visualization: {
                type: 'boolean',
                description: 'Whether to include visualization (optional)',
              },
              optimize_tokens: {
                type: 'boolean',
                description: 'Whether to optimize token usage (optional)',
              },
            },
            required: ['problem'],
          },
        },
        {
          name: 'store_memory',
          description: 'Store a new memory item',
          inputSchema: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                description: 'The type of memory (working, episodic, semantic, procedural)',
              },
              content: {
                type: 'string',
                description: 'The content of the memory',
              },
              importance: {
                type: 'number',
                description: 'The importance of the memory (0-1)',
              },
              connections: {
                type: 'array',
                items: {
                  type: 'string',
                },
                description: 'IDs of connected memory items',
              },
            },
            required: ['type', 'content'],
          },
        },
        {
          name: 'retrieve_memory',
          description: 'Retrieve memory items based on a query',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The query to search for',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of items to retrieve (optional)',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'check_cache',
          description: 'Check if a result is cached',
          inputSchema: {
            type: 'object',
            properties: {
              cache_type: {
                type: 'string',
                description: 'The type of cache to check',
              },
              cache_key: {
                type: 'string',
                description: 'The key to look up in the cache',
              },
            },
            required: ['cache_type', 'cache_key'],
          },
        },
        {
          name: 'store_cache',
          description: 'Store a result in the cache',
          inputSchema: {
            type: 'object',
            properties: {
              cache_type: {
                type: 'string',
                description: 'The type of cache to store in',
              },
              cache_key: {
                type: 'string',
                description: 'The key to store under',
              },
              response: {
                type: 'string',
                description: 'The response to cache',
              },
            },
            required: ['cache_type', 'cache_key', 'response'],
          },
        },
        {
          name: 'perform_maintenance',
          description: 'Perform maintenance on the MCP systems',
          inputSchema: {
            type: 'object',
            properties: {
              systems: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['cache', 'memory', 'thinking', 'optimization', 'all'],
                },
                description: 'The systems to perform maintenance on',
              },
            },
            required: ['systems'],
          },
        },
        {
          name: 'get_token_optimization_stats',
          description: 'Get statistics about token optimization',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'update_token_metrics',
          description: 'Update token metrics with actual token usage',
          inputSchema: {
            type: 'object',
            properties: {
              problem_id: {
                type: 'string',
                description: 'A hash or identifier for the problem',
              },
              estimated_tokens: {
                type: 'number',
                description: 'The estimated token count',
              },
              actual_tokens: {
                type: 'number',
                description: 'The actual token count used',
              },
              model: {
                type: 'string',
                description: 'The thinking model used',
              },
            },
            required: ['problem_id', 'estimated_tokens', 'actual_tokens', 'model'],
          },
        },
        {
          name: 'estimate_token_count',
          description: 'Estimate token count for a given text',
          inputSchema: {
            type: 'object',
            properties: {
              text: {
                type: 'string',
                description: 'The text to estimate tokens for',
              },
              model: {
                type: 'string',
                description: 'The language model to use for estimation (optional)',
              },
            },
            required: ['text'],
          },
        },
      ],
    }));
    
    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request: any): Promise<any> => {
      const { name, arguments: args } = request.params;
      
      switch (name) {
        case 'thinking_process': {
          try {
            const thinkingService = ServiceFactory.getThinkingService(mcpConfig);
            
            // Type assertion for args
            const typedArgs = args as {
              problem: string;
              thinking_model?: string;
              include_visualization?: boolean;
              optimize_tokens?: boolean;
            };
            
            // Validate required problem field
            if (!typedArgs.problem) {
              throw new McpError(
                ErrorCode.InvalidParams,
                "The 'problem' field is required and must be a non-empty string"
              );
            }
            
            if (typeof typedArgs.problem !== 'string' || typedArgs.problem.trim() === '') {
              throw new McpError(
                ErrorCode.InvalidParams,
                "The 'problem' field must be a non-empty string"
              );
            }
            
            const result = await thinkingService.initiateThinkingProcess({
              problem: typedArgs.problem,
              thinking_model: typedArgs.thinking_model,
              include_visualization: typedArgs.include_visualization,
              optimize_tokens: typedArgs.optimize_tokens,
            });
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          } catch (error) {
            console.error('Error in thinking_process tool:', error);
            
            // Format error response
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorCode = error instanceof McpError ? error.code : ErrorCode.InternalError;
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    error: errorMessage,
                    timestamp: new Date().toISOString(),
                    suggestions: [
                      "Make sure your JSON is properly formatted",
                      "The 'problem' field is required and must be a non-empty string",
                      "Optional fields: thinking_model (string), include_visualization (boolean), optimize_tokens (boolean)"
                    ]
                  }, null, 2),
                },
              ],
              isError: true
            };
          }
        }
        
        case 'store_memory': {
          const memoryService = ServiceFactory.getMemoryService();
          
          // Type assertion for args
          const typedArgs = args as {
            type: 'working' | 'episodic' | 'semantic' | 'procedural';
            content: string;
            importance?: number;
            connections?: string[];
          };
          
          await memoryService.storeMemory({
            type: typedArgs.type,
            content: typedArgs.content,
            importance: typedArgs.importance || 0.5,
            connections: typedArgs.connections || [],
            timestamp: new Date().toISOString(), // Add required timestamp
            relevance: 0.5 // Add required relevance
          });
          
          return {
            content: [
              {
                type: 'text',
                text: 'Memory stored successfully',
              },
            ],
          };
        }
        
        case 'retrieve_memory': {
          const memoryService = ServiceFactory.getMemoryService();
          
          // Type assertion for args
          const typedArgs = args as {
            query: string;
            limit?: number;
          };
          
          const results = await memoryService.retrieveMemory(typedArgs.query, typedArgs.limit);
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(results, null, 2),
              },
            ],
          };
        }
        
        case 'check_cache': {
          const cacheService = ServiceFactory.getCacheService();
          
          // Type assertion for args
          const typedArgs = args as {
            cache_type: string;
            cache_key: string;
          };
          
          const result = await cacheService.checkCache(typedArgs.cache_type, typedArgs.cache_key);
          
          return {
            content: [
              {
                type: 'text',
                text: result ? JSON.stringify(result, null, 2) : 'Cache miss',
              },
            ],
          };
        }
        
        case 'store_cache': {
          const cacheService = ServiceFactory.getCacheService();
          
          // Type assertion for args
          const typedArgs = args as {
            cache_type: string;
            cache_key: string;
            response: string;
          };
          
          await cacheService.storeCache(typedArgs.cache_type, typedArgs.cache_key, typedArgs.response);
          
          return {
            content: [
              {
                type: 'text',
                text: 'Cache stored successfully',
              },
            ],
          };
        }
        
        case 'perform_maintenance': {
          // Type assertion for args
          const typedArgs = args as {
            systems: string[];
          };
          
          const systems = typedArgs.systems;
          const results: Record<string, number> = {};
          
          if (systems.includes('all') || systems.includes('memory')) {
            const memoryService = ServiceFactory.getMemoryService();
            results.memory = await memoryService.performMemoryMaintenance();
          }
          
          if (systems.includes('all') || systems.includes('cache')) {
            const cacheService = ServiceFactory.getCacheService();
            results.cache = await cacheService.performCacheMaintenance();
          }
          
          if (systems.includes('all') || systems.includes('thinking')) {
            const thinkingService = ServiceFactory.getThinkingService(mcpConfig);
            results.thinking = await thinkingService.performThinkingMaintenance();
          }
          
          if (systems.includes('all') || systems.includes('optimization')) {
            const tokenOptimizer = ServiceFactory.getTokenOptimizer();
            results.optimization = await tokenOptimizer.performOptimizationMaintenance();
          }
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(results, null, 2),
              },
            ],
          };
        }
        
        case 'get_token_optimization_stats': {
          const tokenOptimizer = ServiceFactory.getTokenOptimizer();
          const stats = tokenOptimizer.getTokenOptimizationStats();
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(stats, null, 2),
              },
            ],
          };
        }
        
        case 'update_token_metrics': {
          const tokenOptimizer = ServiceFactory.getTokenOptimizer();
          // Type assertion for args
          const typedArgs = args as {
            problem_id: string;
            estimated_tokens: number;
            actual_tokens: number;
            model: string;
          };
          
          tokenOptimizer.updateTokenMetrics(
            typedArgs.problem_id,
            typedArgs.estimated_tokens,
            typedArgs.actual_tokens,
            typedArgs.model
          );
          
          return {
            content: [
              {
                type: 'text',
                text: 'Token metrics updated successfully',
              },
            ],
          };
        }
        
        case 'estimate_token_count': {
          const tokenOptimizer = ServiceFactory.getTokenOptimizer();
          
          // Type assertion for args
          const typedArgs = args as {
            text: string;
            model?: string;
          };
          
          // Fix: estimateTokenCount expects only one argument in the interface
          const count = tokenOptimizer.estimateTokenCount(typedArgs.text);
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ count }, null, 2),
              },
            ],
          };
        }
        
        case 'generate_with_mcp': {
          try {
            // Get services
            const memoryService = ServiceFactory.getMemoryService();
            const tokenOptimizer = ServiceFactory.getTokenOptimizer();
            const cacheService = ServiceFactory.getCacheService();
            
            // Validate arguments is a proper JSON object
            if (!args || typeof args !== 'object' || Array.isArray(args)) {
              throw new McpError(ErrorCode.InvalidParams, 'Arguments must be a valid JSON object');
            }

            // Type assertion for args
            const typedArgs = args as {
              prompt: string;
              model?: string;
              max_tokens?: number;
              optimize_tokens?: boolean;
            };
            
            // Validate input
            if (!typedArgs.prompt || typedArgs.prompt.trim() === '') {
              throw new McpError(ErrorCode.InvalidParams, 'Prompt cannot be empty');
            }
            
            // Generate a cache key for this request
            const requestHash = createHash('md5')
              .update(JSON.stringify({
                prompt: typedArgs.prompt,
                model: typedArgs.model,
                max_tokens: typedArgs.max_tokens
              }))
              .digest('hex');
            
            const cacheKey = `mcp_generation:${requestHash}`;
            
            // Check cache first
            const cachedResult = await cacheService.checkCache('generation_cache', cacheKey);
            
            if (cachedResult) {
              console.log(`Cache hit for generation request: ${cacheKey}`);
              
              try {
                const parsedResult = JSON.parse(cachedResult.response);
                return {
                  content: [
                    {
                      type: 'text',
                      text: JSON.stringify({
                        ...parsedResult,
                        cached: true
                      }, null, 2),
                    },
                  ],
                };
              } catch (parseError) {
                console.error('Error parsing cached result:', parseError);
                // Continue with generating a new result
              }
            }
            
            // Apply token optimization if requested
            const shouldOptimizeTokens = typedArgs.optimize_tokens !== false; // Default to true
            let optimizationResult;
            
            if (shouldOptimizeTokens) {
              optimizationResult = tokenOptimizer.optimizeTokenUsage(typedArgs.prompt, {
                user_selected_model: typedArgs.model,
                available_tokens: typedArgs.max_tokens
              });
              
              console.log(`Token optimization applied: ${optimizationResult.selected_model}, estimated tokens: ${optimizationResult.estimated_tokens}`);
            }
            
            // Retrieve relevant memories for context
            const relevantMemories = await memoryService.retrieveMemory(typedArgs.prompt, 5);
            
            // Prepare context from memories
            let contextText = '';
            if (relevantMemories.length > 0) {
              contextText = 'Relevant context from memory:\n';
              relevantMemories.forEach((memory: { content: string }) => {
                contextText += `- ${memory.content}\n`;
              });
              contextText += '\n';
            }
            
            // Prepare the system prompt
            const systemPrompt = `You are an advanced AI assistant powered by the Masterful Cognitive Processor.
Your task is to provide a helpful, accurate, and thoughtful response to the user's prompt.
Use the provided context when relevant, but rely on your own knowledge when the context doesn't contain the necessary information.
Always maintain a helpful and professional tone.`;
            
            // Prepare the full prompt with context
            const fullPrompt = `${contextText}${typedArgs.prompt}`;
            
            // Call the LLM directly using the imported function
            const response = await processStructuredThinking({
              systemPrompt,
              prompt: fullPrompt,
              model: optimizationResult?.selected_model || typedArgs.model || 'internal-processor'
            });
            
            // Prepare the result
            const result = {
              response: response.response,
              model: response.model,
              token_usage: response.tokenUsage,
              optimization: optimizationResult,
              memory_items_used: relevantMemories.length,
              cached: false,
              internal_processing: true
            };
            
            // Store in cache for future use
            await cacheService.storeCache('generation_cache', cacheKey, JSON.stringify(result));
            
            // Store this interaction in memory
            await memoryService.storeMemory({
              type: 'episodic',
              content: `User asked: "${typedArgs.prompt.substring(0, 100)}${typedArgs.prompt.length > 100 ? '...' : ''}"`,
              importance: 0.6,
              connections: [],
              timestamp: new Date().toISOString(), // Add required timestamp
              relevance: 0.6 // Add required relevance
            });
            
            // Return the result
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          } catch (error: any) {
            console.error('Error in generate_with_mcp:', error);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    error: error instanceof Error ? error.message : String(error),
                    status: 'error'
                  }, null, 2),
                },
              ],
              isError: true
            };
          }
        }
        
        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    });
  }
  
  /**
   * Runs the MCP server
   * @returns Promise that resolves when the server is running
   */
  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP Cognitive Processor running on stdio');
  }
}

// Create and run the server
const server = new MCPCognitiveProcessor();
server.run().catch(console.error);