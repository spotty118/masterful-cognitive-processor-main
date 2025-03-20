/**
 * Simplified test script for pipeline metrics integration
 * This script focuses on properly integrating the metrics functionality
 * with minimal dependencies to ensure code remains functional
 */

import { ThinkingEngineState } from '../core/ThinkingEngineState.js';
import { TokenOptimizerImpl } from '../utils/TokenOptimizerImpl.js';
import { ThinkingStep } from '../models/types.js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

/**
 * Calculates coherence score between reasoning steps
 */
function calculateCoherenceScore(steps: ThinkingStep[], currentStep: ThinkingStep, problem: string): number {
  if (!steps || steps.length <= 1) {
    return 0.5; // Default coherence for first step
  }

  // Get previous steps for comparison
  const previousSteps = steps.filter(step => step.id !== currentStep.id);
  
  if (previousSteps.length === 0) {
    return 0.5;
  }

  // Simple text-based comparison for demonstration
  // Count shared terms between current reasoning and previous steps
  const currentTerms = currentStep.reasoning.toLowerCase().split(/\s+/);
  let sharedTermCount = 0;
  let totalTermCount = 0;
  
  for (const step of previousSteps) {
    const stepTerms = step.reasoning.toLowerCase().split(/\s+/);
    for (const term of currentTerms) {
      if (term.length > 3 && stepTerms.includes(term)) { // Only count meaningful terms
        sharedTermCount++;
      }
      totalTermCount++;
    }
  }
  
  // Calculate coherence as ratio of shared terms
  const coherenceScore = totalTermCount > 0 ? sharedTermCount / Math.min(totalTermCount, 38) : 0.5;
  return Math.min(Math.max(coherenceScore, 0), 1); // Ensure score is in [0,1] range
}

/**
 * Calculates complexity score of reasoning
 */
function calculateComplexityScore(reasoning: string): number {
  if (!reasoning || reasoning.trim().length === 0) {
    return 0;
  }
  
  // Simple complexity metrics for demonstration
  const sentences = reasoning.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.trim().length, 0) / Math.max(sentences.length, 1);
  
  // Count "complex" terms (longer words and technical terms) as a simple proxy
  const complexTerms = reasoning.match(/\b\w{8,}\b/g) || [];
  const totalWords = reasoning.split(/\s+/).length;
  
  // Calculate complexity based on sentence length and complex term ratio
  const sentenceFactor = Math.min(avgSentenceLength / 20, 1);
  const complexTermFactor = Math.min((complexTerms.length / totalWords) * 5, 1);
  
  const complexityScore = (sentenceFactor * 0.6) + (complexTermFactor * 0.4);
  return Math.min(Math.max(complexityScore, 0), 1); // Ensure score is in [0,1] range
}

/**
 * Calculates significance score relative to original problem
 */
function calculateSignificanceScore(reasoning: string, problem: string): number {
  if (!reasoning || !problem || reasoning.trim().length === 0 || problem.trim().length === 0) {
    return 0.5; // Default value
  }
  
  // Extract key terms from problem statement
  const problemTerms = new Set(
    problem.toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 3)
      .map(term => term.replace(/[.,!?;:(){}[\]'"]/g, ''))
  );
  
  // Count problem terms that appear in reasoning
  const reasoningText = reasoning.toLowerCase();
  let matchCount = 0;
  
  problemTerms.forEach(term => {
    if (reasoningText.includes(term)) {
      matchCount++;
    }
  });
  
  // Calculate significance as ratio of matched terms
  const significanceScore = problemTerms.size > 0 ? matchCount / problemTerms.size : 0.5;
  return Math.min(Math.max(significanceScore, 0), 1); // Ensure score is in [0,1] range
}

/**
 * Simulated pipeline result structure
 */
interface PipelineResult {
  finalResult: string;
  totalTokens: number;
  intermediateResults: Array<{
    result: string;
    metadata: {
      step: string;
      model: string;
      tokenUsage: {
        total: number;
        prompt: number;
        completion: number;
      }
    }
  }>;
}

/**
 * Simple test function simulating multi-model pipeline processing
 */
async function testPipelineWithMetrics() {
  console.log('Starting simplified pipeline metrics test...');
  
  try {
    // Initialize TokenOptimizer
    const tokenOptimizer = TokenOptimizerImpl.getInstance();
    
    // Simulate a problem and pipeline results
    const testProblem = `Design a recursive algorithm to find the nth Fibonacci number. 
      Analyze its time and space complexity, and suggest optimizations.`;
    
    // Create a properly initialized state
    const state = new ThinkingEngineState({
      problemId: 'fib-test-1',
      problem: testProblem,
      tokenBudget: 5000,
      maxSteps: 10,
      model: {
        name: 'test-model',
        maxTokens: 2000,
        temperature: 0.7
      },
      reasoningSystem: {
        name: 'test-system',
        description: 'Test reasoning system',
        implementation: 'hybrid'
      }
    });
    
    // Simulate pipeline results from different models
    const simulatedResults: PipelineResult = {
      finalResult: "The recursive algorithm for finding the nth Fibonacci number has exponential time complexity but can be optimized using memoization or an iterative approach.",
      totalTokens: 350,
      intermediateResults: [
        {
          result: "The Fibonacci sequence is defined recursively where each number is the sum of the two preceding ones. A naive recursive algorithm would call itself multiple times with overlapping subproblems.",
          metadata: {
            step: "Initial Preprocessing",
            model: "Gemini Flash",
            tokenUsage: {
              total: 80,
              prompt: 30,
              completion: 50
            }
          }
        },
        {
          result: "The standard recursive algorithm for Fibonacci has exponential time complexity O(2^n) because it recalculates the same values repeatedly. The space complexity is O(n) due to the call stack.",
          metadata: {
            step: "Advanced Preprocessing",
            model: "Gemini Pro",
            tokenUsage: {
              total: 90,
              prompt: 40,
              completion: 50
            }
          }
        },
        {
          result: "To optimize, we can use memoization to store previously computed values, reducing time complexity to O(n). Alternatively, an iterative approach using dynamic programming can achieve O(n) time with O(1) space by only storing the two most recent values.",
          metadata: {
            step: "Preliminary Reasoning",
            model: "DeepSeek",
            tokenUsage: {
              total: 100,
              prompt: 40,
              completion: 60
            }
          }
        },
        {
          result: "For further optimization, we can use matrix exponentiation to compute Fibonacci numbers in O(log n) time. This approach relies on the property that matrix multiplication can be optimized using the divide-and-conquer technique of exponentiation by squaring.",
          metadata: {
            step: "Final Reasoning",
            model: "Claude",
            tokenUsage: {
              total: 80,
              prompt: 30,
              completion: 50
            }
          }
        }
      ]
    };
    
    // Add pipeline results as thinking steps and calculate metrics
    console.log('Converting pipeline results to thinking steps...');
    
    for (const [index, step] of simulatedResults.intermediateResults.entries()) {
      // First add the step
      await state.addStep({
        id: `step-${index + 1}`,
        description: step.metadata.step,
        reasoning: step.result,
        tokens: step.metadata.tokenUsage.total,
        status: 'completed',
        timestamp: new Date().toISOString()
      });
    }
    
    // Get the steps and calculate metrics
    const steps = (state as any).steps || [];
    
    // Calculate and update metrics for each step
    console.log('\nCalculating metrics for reasoning steps...');
    
    for (const step of steps) {
      if (!step.metrics) {
        step.metrics = {};
      }
      
      // Calculate coherence score
      step.metrics.coherence = calculateCoherenceScore(steps, step, testProblem);
      
      // Calculate complexity score
      step.metrics.complexity = calculateComplexityScore(step.reasoning);
      
      // Calculate significance score
      step.metrics.significanceScore = calculateSignificanceScore(step.reasoning, testProblem);
      
      console.log(`\nMetrics for ${step.description}:`);
      console.log(`- Coherence: ${step.metrics.coherence.toFixed(4)}`);
      console.log(`- Complexity: ${step.metrics.complexity.toFixed(4)}`);
      console.log(`- Significance: ${step.metrics.significanceScore.toFixed(4)}`);
    }
    
    // Output the final state
    console.log('\n--- FINAL STATE WITH METRICS ---');
    for (const step of steps) {
      console.log(`\nStep: ${step.description} (${step.tokens} tokens)`);
      console.log(`Reasoning: ${step.reasoning.substring(0, 100)}...`);
      console.log('Metrics:');
      console.log(`- Coherence: ${step.metrics?.coherence.toFixed(4)}`);
      console.log(`- Complexity: ${step.metrics?.complexity.toFixed(4)}`);
      console.log(`- Significance: ${step.metrics?.significanceScore.toFixed(4)}`);
    }
    
    // Calculate average metrics across all steps
    const avgCoherence = steps.reduce((sum: number, step: ThinkingStep) => sum + (step.metrics?.coherence || 0), 0) / steps.length;
    const avgComplexity = steps.reduce((sum: number, step: ThinkingStep) => sum + (step.metrics?.complexity || 0), 0) / steps.length;
    const avgSignificance = steps.reduce((sum: number, step: ThinkingStep) => sum + (step.metrics?.significanceScore || 0), 0) / steps.length;
    
    console.log('\n--- OVERALL METRICS SUMMARY ---');
    console.log(`Average Coherence: ${avgCoherence.toFixed(4)}`);
    console.log(`Average Complexity: ${avgComplexity.toFixed(4)}`);
    console.log(`Average Significance: ${avgSignificance.toFixed(4)}`);
    console.log(`Total Tokens Used: ${simulatedResults.totalTokens}`);
    
    console.log('\nSimplified pipeline metrics test completed successfully!');
    
  } catch (error) {
    console.error('An error occurred during the test:', error);
  }
}

// Run the test
testPipelineWithMetrics().catch(error => {
  console.error('Unhandled error in test execution:', error);
});
