/// <reference types="mocha" />
/// <reference types="chai" />

import { expect } from 'chai';
import { TokenOptimizerImpl } from '../../src/utils/TokenOptimizerImpl.js';
import { ThinkingEngine } from '../../src/core/ThinkingEngine.js';

// Define types directly to avoid import issues
interface ThinkingModel {
  name: string;
  maxTokens?: number;
  temperature?: number;
  contextWindow?: number;
}

interface MCPConfig {
  defaultModel: ThinkingModel;
  maxStepsPerStrategy: number;
  tokenBudget: number;
  memoryPath: string;
  cachePath: string;
  optimizationThreshold: number;
  name: string;
  version: string;
  description: string;
  core: {
    thinkingModels: ThinkingModel[];
    intelligence: {
      reasoningSystems: any[];
      abstractionLevels: any[];
    };
  };
  stepByStepThinking: {
    enabled: boolean;
    documentationLevel: string;
    components: any[];
  };
  memory: {
    systemType: string;
    components: any[];
  };
}

describe('Token Optimization Integration Tests', () => {
  let tokenOptimizer: TokenOptimizerImpl;
  let thinkingEngine: ThinkingEngine;
  let config: MCPConfig;
  
  beforeEach(() => {
    tokenOptimizer = new TokenOptimizerImpl();
    config = {
      defaultModel: {
        name: 'standard',
        maxTokens: 1000,
        temperature: 0.7,
        contextWindow: 4000
      },
      maxStepsPerStrategy: 10,
      tokenBudget: 4000,
      memoryPath: 'data/memory',
      cachePath: 'data/cache',
      optimizationThreshold: 0.7,
      name: 'Test MCP',
      version: '1.0.0',
      description: 'Test configuration',
      core: {
        thinkingModels: [
          {
            name: 'standard',
            maxTokens: 1000,
            temperature: 0.7,
            contextWindow: 4000
          }
        ],
        intelligence: {
          reasoningSystems: [
            {
              name: 'chain_of_thought',
              description: 'Sequential reasoning',
              implementation: 'standard'
            }
          ],
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
      }
    };
    thinkingEngine = new ThinkingEngine(config, tokenOptimizer);
  });

  it('should properly optimize token usage in thinking process', async () => {
    // Test with a long problem that needs optimization
    const longProblem = `
      Given a complex system architecture with multiple microservices,
      extensive data processing requirements, real-time analytics,
      and high scalability needs. Design a solution that addresses
      performance, security, and maintainability concerns while
      ensuring optimal resource utilization and cost-effectiveness.
      Consider integration patterns, data flow, monitoring, and
      error handling strategies. Provide a detailed step-by-step
      analysis of the proposed solution.
    `.repeat(10); // Make it longer to trigger optimization

    const model: ThinkingModel = {
      name: 'standard',
      maxTokens: 1000,
      temperature: 0.7,
      contextWindow: 4000
    };

    const result = await thinkingEngine.processProblem(longProblem, model, {
      optimizeTokens: true
    });

    expect(result.steps).to.be.an('array');
    expect(result.reasoning).to.be.an('array');
    expect(result.tokenUsage).to.be.a('number');
    if (result.tokenUsage !== undefined) {
      expect(result.tokenUsage).to.be.lessThan(model.maxTokens || Infinity);
    }
  });

  it('should provide optimization suggestions for large inputs', () => {
    const largeInput = 'This is a test input that would normally be quite long.'.repeat(100);
    
    const result = tokenOptimizer.optimizeTokenUsage(largeInput, {
      available_tokens: 1000
    });

    expect(result.optimization_applied).to.be.true;
    expect(result.suggested_changes).to.be.an('array');
    expect(result.token_savings).to.be.greaterThan(0);
    expect(result.optimized_prompt).to.exist;
    expect(result.selected_model).to.be.a('string');
  });

  it('should track token usage metrics accurately', () => {
    const problem = 'Test problem';
    const problemId = 'test-123';
    const estimatedTokens = tokenOptimizer.estimateTokenCount(problem);
    const actualTokens = Math.round(estimatedTokens * 1.1); // Simulate actual usage
    const model = 'gpt-3.5-turbo';

    tokenOptimizer.updateTokenMetrics(problemId, estimatedTokens, actualTokens, model);
    const stats = tokenOptimizer.getTokenOptimizationStats();

    expect(stats.totalOptimizations).to.be.a('number');
    expect(stats.averageSavings).to.be.a('number');
    expect(stats.topPatterns).to.be.an('array');
  });
});