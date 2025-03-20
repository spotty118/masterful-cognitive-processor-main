/**
 * Core type definitions for the MCP system
 */

export interface MemoryItem {
  id: string;
  type: 'working' | 'episodic' | 'semantic' | 'procedural';
  content: string;
  timestamp: string;
  importance: number;
  relevance: number;
  connections: string[];
}

export interface ThinkingStep {
  id: string;
  description: string;
  reasoning: string;
  tokens: number;
  status: 'pending' | 'active' | 'completed' | 'error';
  timestamp: string;
  confidence?: number;
  metrics?: {
    complexityScore?: number;
    tokenEfficiency?: number;
    uncertaintyFactors?: string[];
    coherence?: number; // Measure of reasoning coherence with previous steps
    complexity?: number; // Complexity of the reasoning approach
    significanceScore?: number; // How significant this step is to solution
  };
}

export interface VectorItem {
  id: string;
  content: string;
  vector: number[];
  metadata: {
    type: string;
    source: string;
    timestamp: string;
  };
}

export interface MemoryVector {
  itemId: string;
  vector: number[];
  created: string;
  updated?: string;
}

export interface TokenUsage {
  component: string;
  allocated: number;
  used: number;
  optimized: number;
  savings: number;
}

export interface ThinkingModel {
  name: string;
  description?: string;
  tokenLimit?: string;
  complexity?: string;
  features?: string[];
  maxTokens?: number;
  temperature?: number;
  contextWindow?: number;
}

export interface ReasoningSystem {
  name: string;
  description: string;
  implementation: string;
}

export interface AbstractionLevel {
  name: string;
  focus: string;
}

export interface ThinkingCapability {
  name: string;
  description: string;
}

export interface OutputFormat {
  name: string;
  description: string;
}

export interface MCPConfig {
  defaultModel: ThinkingModel;
  maxStepsPerStrategy: number;
  tokenBudget: number;
  memoryPath: string;
  cachePath: string;
  optimizationThreshold: number;
  name: string;
  version: string;
  maxSteps?: number;
  description: string;
  core: {
    strategies?: {
      dynamicSelection?: boolean;
      preferredStrategies?: {
        [problemType: string]: string;
      }
    };
    thinkingModels: ThinkingModel[];
    intelligence: {
      reasoningSystems: ReasoningSystem[];
      abstractionLevels: AbstractionLevel[];
    };
  };
  stepByStepThinking: {
    enabled: boolean;
    documentationLevel: string;
    components: {
      name: string;
      description: string;
      capabilities: ThinkingCapability[];
      outputFormats?: OutputFormat[];
    }[];
  };
  memory: {
    systemType: string;
    components: {
      name: string;
      description: string;
      capacity: string;
      persistenceLevel: string;
      [key: string]: string | number | boolean | object | undefined;
    }[];
  };
  preprocessingPipeline: PreprocessingPipelineConfig;
}

// Token optimization interfaces
export interface TokenOptimizationConfig {
  complexity_threshold: number;
  low_novelty_threshold: number;
  high_novelty_threshold: number;
  enable_pattern_reuse: boolean;
  enable_solution_adaptation: boolean;
}

export interface OptimizationContext {
  user_history?: string[];
  domain_context?: string;
  available_tokens?: number;
  user_selected_model?: string;
}

export interface OptimizationResult {
  optimized_prompt?: string;
  selected_model: string;
  estimated_tokens: number;
  optimization_applied: boolean;
  suggested_changes?: string[];
  token_savings?: number;
  optimization_strategy?: string;
  similar_problems?: Array<{
    problem: string;
    similarity_score: number;
  }>;
  domain?: string;
  concepts?: string[];
}

export interface OptimizationMetrics {
  timestamp: number;
  optimizationCount: number;
  tokensSaved: number;
  averageSavings: number;
}

// Thinking process interfaces
export interface ThinkingRequest {
  problem: string;
  thinking_model?: string;
  include_visualization?: boolean;
  optimize_tokens?: boolean;
  optimization_context?: OptimizationContext;
}

export interface ThinkingResult {
  processId: string;
  steps: ThinkingStep[];
  duration: number;
  model: string;
  optimization?: OptimizationResult;
  visualization?: ThinkingVisualization;
  [key: string]: any;
}

export interface ThinkingResponse {
  result: string;
  documentation: {
    problemId: string;
    steps: ThinkingStep[];
    model: string;
    visualization?: object;
    [key: string]: ThinkingStep[] | string | number | boolean | object | undefined;
  };
  optimization?: OptimizationResult;
}

export interface ThinkingOptions {
  model?: ThinkingModel;
  maxSteps?: number;
  tokenBudget?: number;
  strategy?: string;
}

export interface ThinkingVisualization {
  processId?: string;
  type: 'linear' | 'tree' | 'network' | 'hierarchical';
  nodes: Array<{
    id: string;
    label: string;
    status: string;
    details?: string;
    depth?: number;
  }>;
  edges: Array<{
    source: string;
    target: string;
    label?: string;
  }>;
  layout?: {
    type: string;
    direction?: string;
    levelSeparation?: number;
    nodeSpacing?: number;
    treeSpacing?: number;
    springLength?: number;
    springConstant?: number;
    dragCoeff?: number;
    gravity?: number;
  };
}

export interface ProcessConfig {
  maxStepsPerStrategy: number;
  tokenBudget: number;
  optimizationThreshold: number;
}

export interface CacheResult {
  response: string;
  timestamp: string;
}

export interface GenerationRequest {
  prompt: string;
  model?: string;
  max_tokens?: number;
  optimize_tokens?: boolean;
}

export interface GenerationResponse {
  response: string;
  model: string;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
  cached?: boolean;
  thinking_steps?: Array<{
    id: string;
    description: string;
    reasoning: string;
    tokens: number;
  }>;
  selected_model?: string;
  tokens_used?: number;
  complexity_score?: number;
}

// Memory interfaces
export interface MemoryResult {
  id: string;
  content: string;
  relevance: number;
}

export interface TokenHistory {
  id: string;
  queryHash: string;
  prompt: string;
  model: string;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
  timestamp: string;
  semanticContext?: string;
  frequency: number;
  lastAccessed: string;
}

export interface TokenPredictionResult {
  estimatedTokens: number;
  confidence: number;
  model: string;
  queryHash?: string;
  probability?: number;
  suggestedModel?: string;
  similarQueries?: Array<{ queryHash: string; similarity: number }>;
  factors: {
    textLength: number;
    complexity: number;
    specialTokens: number;
  };
}

export interface TokenUsageStats {
  totalTokens: number;
  requestCount: number;
  averageTokensPerRequest: number;
  modelBreakdown: Record<string, ModelUsage>;
}

export interface ModelUsage {
  totalTokens: number;
  requests: number;
  avgTokensPerRequest: number;
}

// LLM interfaces
export interface LLMRequest {
  prompt?: string;
  messages?: Array<{role: string, content: string}>;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  response: string;
  model: string;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
  cached?: boolean;
  smartCached?: boolean;
  similarity?: number;
  latency?: number;
  error?: string;
}

// Reasoning interfaces
export interface ReasoningRequest {
  problem: string;
  reasoningSystem?: string;
  context?: string[];
  maxSteps?: number;
  includeIntermediateSteps?: boolean;
}

export interface ReasoningResponse {
  problem: string;
  reasoningSystem: string;
  steps: ThinkingStep[];
  conclusion: string;
  confidence: number;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  optimization?: OptimizationResult;
  error?: string;
}

// Preprocessing pipeline interfaces
export interface AIModelConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
}

export interface PipelineStep {
  name: string;
  description: string;
  service: 'gemini' | 'claude' | 'deepseek' | 'googleflash';
  priority: number;
}

export interface PreprocessingPipelineConfig {
  enabled: boolean;
  gemini: AIModelConfig;
  claude: AIModelConfig;
  pipelineSteps: PipelineStep[];
}