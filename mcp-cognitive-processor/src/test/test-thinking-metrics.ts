/**
 * Test script focused specifically on the ThinkingEngine metrics calculations
 */

import { ThinkingEngine } from '../core/ThinkingEngine.js';
import { ThinkingEngineState } from '../core/ThinkingEngineState.js';
import { TokenOptimizerImpl } from '../utils/TokenOptimizerImpl.js';
import { MCPConfig } from '../models/types.js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  console.log('Starting metrics test...');
  
  try {
    // Create a basic configuration
    const config: MCPConfig = {
      defaultModel: {
        name: 'test-model',
        maxTokens: 2000,
        temperature: 0.7
      },
      maxStepsPerStrategy: 5,
      tokenBudget: 5000,
      memoryPath: './data/memory',
      cachePath: './data/cache',
      optimizationThreshold: 0.8,
      name: 'Test Config',
      version: '1.0.0',
      description: 'Test configuration for metrics',
      core: {
        thinkingModels: [
          {
            name: 'test-model',
            maxTokens: 2000,
            temperature: 0.7
          }
        ],
        intelligence: {
          reasoningSystems: [
            {
              name: 'test-system',
              description: 'Test reasoning system',
              implementation: 'hybrid'
            }
          ],
          abstractionLevels: [
            {
              name: 'test-level',
              focus: 'test'
            }
          ]
        }
      },
      stepByStepThinking: {
        enabled: true,
        documentationLevel: 'detailed',
        components: [
          {
            name: 'test-component',
            description: 'Test component',
            capabilities: [
              {
                name: 'test-capability',
                description: 'Test capability'
              }
            ]
          }
        ]
      },
      memory: {
        systemType: 'basic',
        components: [
          {
            name: 'test-memory',
            description: 'Test memory',
            capacity: 'unlimited',
            persistenceLevel: 'session'
          }
        ]
      },
      preprocessingPipeline: {
        enabled: true,
        gemini: {
          model: 'gemini-pro',
          temperature: 0.7,
          maxTokens: 1000
        },
        claude: {
          model: 'claude-3-opus-20240229',
          temperature: 0.7,
          maxTokens: 1000
        },
        pipelineSteps: []
      }
    };
    
    // Create a state and engine
    console.log('Creating ThinkingEngine and state...');
    const state = new ThinkingEngineState({
      problemId: 'test-1',
      problem: 'What is the best approach to solve the traveling salesman problem?',
      tokenBudget: 5000,
      maxSteps: 10,
      model: config.defaultModel,
      reasoningSystem: {
        name: 'test-system',
        description: 'Test reasoning system',
        implementation: 'hybrid'
      }
    });
    
    // Get the TokenOptimizer singleton instance for the ThinkingEngine
    const tokenOptimizer = TokenOptimizerImpl.getInstance();
    
    // Initialize the ThinkingEngine with the required parameters
    const engine = new ThinkingEngine(config, tokenOptimizer);
    
    // Test adding steps with metrics
    console.log('Adding test steps with metrics...');
    
    // Step 1: Initial approach
    await state.addStep({
      id: 'step-1',
      description: 'Initial approach analysis',
      reasoning: 'The traveling salesman problem (TSP) is an NP-hard problem in combinatorial optimization. A brute force approach would examine all possible permutations of cities, but this becomes computationally infeasible for even moderate numbers of cities.',
      tokens: 150,
      status: 'completed' as 'pending' | 'active' | 'completed' | 'error',
      timestamp: new Date().toISOString(),
      metrics: {
        coherence: 1.0, // First step is coherent by default
        complexity: 0.65,
        significanceScore: 0.85
      }
    });
    
    // Step 2: Algorithmic solutions
    await state.addStep({
      id: 'step-2',
      description: 'Algorithmic solutions',
      reasoning: 'Several algorithmic approaches exist for TSP: 1) Heuristic methods like nearest neighbor and greedy algorithms provide approximate solutions. 2) Dynamic programming can solve TSP optimally for small instances. 3) Branch and bound algorithms can find exact solutions for moderate instances.',
      tokens: 200,
      status: 'completed' as 'pending' | 'active' | 'completed' | 'error',
      timestamp: new Date().toISOString(),
      metrics: {
        coherence: 0.78, // Shares terms with first step
        complexity: 0.72,
        significanceScore: 0.9
      }
    });
    
    // Step 3: Advanced techniques
    await state.addStep({
      id: 'step-3',
      description: 'Advanced techniques',
      reasoning: 'For large-scale TSP instances, metaheuristic approaches are often preferred: 1) Genetic algorithms maintain a population of solutions and evolve better solutions through crossover and mutation. 2) Simulated annealing mimics the physical process of annealing in metallurgy, allowing occasional uphill moves to escape local optima.',
      tokens: 180,
      status: 'completed' as 'pending' | 'active' | 'completed' | 'error',
      timestamp: new Date().toISOString(),
      metrics: {
        coherence: 0.65, // Less overlap with previous steps
        complexity: 0.8,
        significanceScore: 0.83
      }
    });
    
    // Access steps from the state
    console.log('Retrieving steps from state...');
    const steps = (state as any).steps || [];
    
    // Display metrics for each step
    console.log('\nMetrics Analysis:');
    
    for (const step of steps) {
      console.log(`\nStep: ${step.description}`);
      console.log(`Reasoning: ${step.reasoning.substring(0, 100)}...`);
      
      if (step.metrics) {
        console.log('Metrics:');
        console.log(`- Coherence Score: ${step.metrics.coherence !== undefined ? step.metrics.coherence : 'N/A'}`);
        console.log(`- Complexity Score: ${step.metrics.complexity !== undefined ? step.metrics.complexity : 'N/A'}`);
        console.log(`- Significance Score: ${step.metrics.significanceScore !== undefined ? step.metrics.significanceScore : 'N/A'}`);
      } else {
        console.log('No metrics available for this step');
      }
    }
    
    console.log('\nMetrics test completed!');
    
  } catch (error) {
    console.error('Error in metrics test:');
    if (error instanceof Error) {
      console.error(`- Name: ${error.name}`);
      console.error(`- Message: ${error.message}`);
      console.error(`- Stack: ${error.stack}`);
    } else {
      console.error(`- Unknown error: ${String(error)}`);
    }
  }
}

// Run the test
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
