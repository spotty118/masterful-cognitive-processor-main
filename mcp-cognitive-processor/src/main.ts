#!/usr/bin/env node
/**
 * Main entry point for the Masterful Cognitive Processor
 */
import { IMemoryService } from './interfaces/IMemoryService.js';
import { ICacheService } from './interfaces/ICacheService.js';

// Node.js built-in imports
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

// MCP SDK imports
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

// Local imports - Config and Utils
import { mcpConfig } from './config/mcp-config.js';
import { TokenOptimizerImpl } from './utils/TokenOptimizerImpl.js';
import { MemoryManager } from './utils/MemoryManager.js';

// Local imports - Services and Factories
import { ServiceFactory } from './factories/ServiceFactory.js';
import { DIServiceFactory } from './factories/DIServiceFactory.js';
import { ThinkingServiceImpl } from './services/ThinkingServiceImpl.js';
import { ModelFallbackService } from './services/ModelFallbackService.js';
import { GeminiService } from './services/GeminiService.js';
import { GeminiServiceOpenAI } from './services/GeminiServiceOpenAI.js';
import { ThinkingEngine } from './core/ThinkingEngine.js';
import * as memoryServiceUtils from './services/memoryService.js';
import * as cacheServiceUtils from './services/cacheService.js';
import { processStructuredThinking } from './services/intelligenceService.js';
import tokenHistoryService from './services/tokenHistoryService.js';

// Load environment variables
// Get current directory path in ESM
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const envResult = dotenv.config({ path: path.resolve(__dirname, '../.env') });
console.log('Trying to load .env from:', path.resolve(__dirname, '../.env'));

if (envResult.error) {
  console.warn('Failed to load .env file from expected path, trying current directory...');
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

// Log environment variable status
console.log('OPENROUTER_API_KEY status:', process.env.OPENROUTER_API_KEY ? 'Set' : 'Not set');

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

// Initialize required services
const openRouterApiKey = process.env.OPENROUTER_API_KEY || '';
if (!openRouterApiKey) {
  console.error('ERROR: OPENROUTER_API_KEY is required');
  process.exit(1);
}

// Initialize DIServiceFactory first
console.log('*** DEBUG: About to initialize DIServiceFactory ***');
try {
  // IMPORTANT: Need to await this promise since it's an async method!
  await DIServiceFactory.initialize({
    name: 'mcp-cognitive-processor',
    version: '1.0.0'
  });
  console.log('*** DEBUG: DIServiceFactory.initialize complete ***');
  console.log('Service factory initialized successfully');
} catch (error) {
  console.error('Failed to initialize service factory:', error);
  process.exit(1);
}

// Initialize token optimizer
const tokenOptimizer = TokenOptimizerImpl.getInstance();
await tokenOptimizer.init();
console.log('Token optimizer initialized successfully');

// Debug: Check which services are registered after initialization
console.log('*** DEBUG: Checking if services exist after initialization ***');
console.log('*** DEBUG: geminiService exists:', DIServiceFactory.hasService('geminiService'));
console.log('*** DEBUG: thinkingService exists:', DIServiceFactory.hasService('thinkingService'));
console.log('*** DEBUG: openRouterService exists:', DIServiceFactory.hasService('openRouterService'));

// Initialize ModelFallbackService
const fallbackService = ModelFallbackService.getInstance({
  timeout: 30000,
  maxRetries: 3,
  healthCheckInterval: 60000
});

// Debug: Manually create and register services if they don't exist
if (!DIServiceFactory.hasService('geminiService')) {
  console.log('*** DEBUG: Services not found, manually creating and registering them ***');
  // Get Container.ts directly to access its instance method
  const { Container } = await import('./core/Container.js');
  const container = Container.getInstance();
  
  // Import required services
  const { GeminiServiceOpenAI } = await import('./services/GeminiServiceOpenAI.js');
  const { O1MiniService } = await import('./services/O1MiniService.js');
  const { ModelFallbackService } = await import('./services/ModelFallbackService.js');

  // Create service instances
  const geminiService = new GeminiServiceOpenAI(openRouterApiKey);
  const o1MiniService = new O1MiniService(openRouterApiKey);

  // Register services with fallback configuration
  fallbackService.registerProvider('gemini-pro', geminiService, 2, 1.0); // Higher priority for primary
  fallbackService.registerProvider('o1-mini', o1MiniService, 1, 0.8); // Lower priority for backup

  // Register services in container
  container.register('geminiService', geminiService);
  container.register('o1MiniService', o1MiniService);
  container.register('fallbackService', fallbackService);

  console.log('*** DEBUG: Manually registered services, checking again ***');
  console.log('*** DEBUG: geminiService exists now:', DIServiceFactory.hasService('geminiService'));
}

// Get the initialized Gemini service from the container
try {
  const geminiService = DIServiceFactory.getService<GeminiServiceOpenAI>('geminiService');
  console.log('*** DEBUG: Successfully got geminiService from container ***');
} catch (error) {
  console.error('Failed to get Gemini service from container:', error);
  process.exit(1);
}

// Create and configure the thinking service with injected dependencies
const thinkingService = DIServiceFactory.getService<ThinkingServiceImpl>('thinkingService');
if (!thinkingService) {
  console.error('Failed to get thinking service from container');
  process.exit(1);
}

console.log('All services initialized successfully');

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

// Default export for convenient importing
export default {
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
  private thinkingService: ThinkingServiceImpl;
  private memoryService: IMemoryService;
  private cacheService: ICacheService;
  private tokenOptimizer: TokenOptimizerImpl;
  
  /**
   * Constructor for MCPCognitiveProcessor
   * Sets up the server and request handlers
   */
  constructor() {
    // Get services from DI container
    this.thinkingService = DIServiceFactory.getService<ThinkingServiceImpl>('thinkingService');
    this.memoryService = DIServiceFactory.getService<IMemoryService>('memoryService');
    this.cacheService = DIServiceFactory.getService<ICacheService>('cacheService');
    this.tokenOptimizer = DIServiceFactory.getService<TokenOptimizerImpl>('tokenOptimizer');

    // Validate required services
    if (!this.thinkingService || !this.memoryService || !this.cacheService || !this.tokenOptimizer) {
      throw new Error('Required services not available');
    }

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
          // Use the injected thinkingService instance
          if (!this.thinkingService) {
            throw new Error('Thinking service not initialized');
          }

          // Better error handling and type validation for args
          try {
            // Type assertion for args with input validation
            if (!args || typeof args !== 'object') {
              throw new Error('Invalid arguments: expecting JSON object');
            }

            // Validate required problem field
            if (!('problem' in args) || typeof args.problem !== 'string' || args.problem.trim() === '') {
              throw new Error('Invalid or missing "problem" field: must be a non-empty string');
            }

            const typedArgs = {
              problem: args.problem,
              thinking_model: (typeof args.thinking_model === 'string') ? args.thinking_model : 'standard',
              include_visualization: (typeof args.include_visualization === 'boolean') ? args.include_visualization : false,
              optimize_tokens: (typeof args.optimize_tokens === 'boolean') ? args.optimize_tokens : false
            };

            console.log('Initiating thinking process with args:', JSON.stringify(typedArgs));

            const result = await this.thinkingService.initiateThinkingProcess(typedArgs);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          } catch (error) {
            console.error('Error in thinking_process handler:', error);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    error: error instanceof Error ? error.message : 'Invalid JSON argument for thinking_process',
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
          // Use the injected memoryService instance
          if (!this.memoryService) {
            throw new Error('Memory service not initialized');
          }

          // Type assertion for args
          const typedArgs = args as {
            type: 'working' | 'episodic' | 'semantic' | 'procedural';
            content: string;
            importance?: number;
            connections?: string[];
          };

          await this.memoryService.storeMemory({
            type: typedArgs.type,
            content: typedArgs.content,
            importance: typedArgs.importance || 0.5,
            connections: typedArgs.connections || [],
            timestamp: new Date().toISOString(),
            relevance: 0.5
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
          // Use the injected memoryService instance
          if (!this.memoryService) {
            throw new Error('Memory service not initialized');
          }

          // Type assertion for args
          const typedArgs = args as {
            query: string;
            limit?: number;
          };

          const results = await this.memoryService.retrieveMemory(typedArgs.query, typedArgs.limit);

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
          // Use the injected cacheService instance
          if (!this.cacheService) {
            throw new Error('Cache service not initialized');
          }

          // Type assertion for args
          const typedArgs = args as {
            cache_type: string;
            cache_key: string;
          };

          const result = await this.cacheService.checkCache(typedArgs.cache_type, typedArgs.cache_key);

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
          // Use the injected cacheService instance
          if (!this.cacheService) {
            throw new Error('Cache service not initialized');
          }

          // Type assertion for args
          const typedArgs = args as {
            cache_type: string;
            cache_key: string;
            response: string;
          };

          await this.cacheService.storeCache(typedArgs.cache_type, typedArgs.cache_key, typedArgs.response);

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
            results.memory = await this.memoryService.performMemoryMaintenance();
          }

          if (systems.includes('all') || systems.includes('cache')) {
            results.cache = await this.cacheService.performCacheMaintenance();
          }

          if (systems.includes('all') || systems.includes('thinking')) {
            results.thinking = await this.thinkingService.performThinkingMaintenance();
          }

          if (systems.includes('all') || systems.includes('optimization')) {
            results.optimization = await this.tokenOptimizer.performOptimizationMaintenance();
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
          // Use class instance
          const stats = this.tokenOptimizer.getTokenOptimizationStats();

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
          // Use class instance
          // Type assertion for args
          const typedArgs = args as {
            problem_id: string;
            estimated_tokens: number;
            actual_tokens: number;
            model: string;
          };

          this.tokenOptimizer.updateTokenMetrics(
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
          // Use class instance

          // Type assertion for args
          const typedArgs = args as {
            text: string;
            model?: string;
          };

          // Fix: estimateTokenCount expects only one argument in the interface
          const count = this.tokenOptimizer.estimateTokenCount(typedArgs.text);

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
            // All services are available as class properties

            // Validate service interfaces
            if (!('retrieveMemory' in this.memoryService) || !('storeMemory' in this.memoryService)) {
              throw new Error('Memory service missing required methods');
            }

            if (!('checkCache' in this.cacheService) || !('storeCache' in this.cacheService)) {
              throw new Error('Cache service missing required methods');
            }

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
            const cachedResult = await this.cacheService.checkCache('generation_cache', cacheKey);

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
              optimizationResult = this.tokenOptimizer.optimizeTokenUsage(typedArgs.prompt, {
                user_selected_model: typedArgs.model,
                available_tokens: typedArgs.max_tokens
              });

              console.log(`Token optimization applied: ${optimizationResult.selected_model}, estimated tokens: ${optimizationResult.estimated_tokens}`);
            }

            // Retrieve relevant memories for context
            const relevantMemories = await this.memoryService.retrieveMemory(typedArgs.prompt, 5);

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
            await this.cacheService.storeCache('generation_cache', cacheKey, JSON.stringify(result));

            // Store this interaction in memory
            await this.memoryService.storeMemory({
              type: 'episodic',
              content: `User asked: "${typedArgs.prompt.substring(0, 100)}${typedArgs.prompt.length > 100 ? '...' : ''}"`,
              importance: 0.6,
              connections: [],
              timestamp: new Date().toISOString(),
              relevance: 0.6
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

// Initialize services and start server
async function startServer() {
  console.log('Initializing services...');
  try {
    // Initialize DIServiceFactory with configuration
    DIServiceFactory.initialize({
      name: mcpConfig.name,
      version: mcpConfig.version,
    });
    console.log('Service factory initialized successfully');

    // Verify critical services
    const processor = new MCPCognitiveProcessor();
    await processor.run();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server when this module is run directly
if (import.meta.url === new URL(import.meta.url).href) {
  startServer();
}
