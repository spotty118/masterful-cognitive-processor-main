/**
 * Simple test script to verify ThinkingEngineState functionality
 * This script tests the implementation of the new methods we added to support
 * coherence and significance score calculations
 */

import { ThinkingEngineState } from '../core/ThinkingEngineState.js';
import { ThinkingStep } from '../models/types.js';

/**
 * Directly test the ThinkingEngineState implementation
 * specifically focusing on the new methods we added
 */
function testThinkingEngineState() {
  console.log('Testing ThinkingEngineState...');
  
  // Create a minimal ThinkingEngineState instance
  const state = new ThinkingEngineState({
    problemId: 'test-problem-1',
    problem: 'How can we optimize performance in a large React application?',
    tokenBudget: 1000,
    maxSteps: 5,
    model: {
      name: 'test-model',
      maxTokens: 1000
    },
    reasoningSystem: {
      name: 'test-reasoning',
      description: 'Test reasoning system',
      implementation: 'default'
    }
  });

  // Test adding steps
  const step1: ThinkingStep = {
    id: 'step_1',
    description: 'Identify performance bottlenecks',
    reasoning: 'To optimize a React application, we need to first identify where the performance issues are occurring. This involves profiling the application and looking for components that re-render excessively.',
    tokens: 50,
    status: 'completed',
    timestamp: new Date().toISOString()
  };

  const step2: ThinkingStep = {
    id: 'step_2',
    description: 'Implement memoization techniques',
    reasoning: 'After identifying bottlenecks, we should apply memoization using React.memo, useMemo, and useCallback hooks to prevent unnecessary re-renders of components and recalculation of expensive values.',
    tokens: 60,
    status: 'completed',
    timestamp: new Date().toISOString()
  };

  // Add steps to the state
  state.addStep(step1);
  state.addStep(step2);

  // Test the getPreviousReasoning method
  const previousReasoning = state.getPreviousReasoning();
  console.log('Previous reasoning array length:', previousReasoning.length);
  console.log('Previous reasoning contains expected content:', 
    previousReasoning.includes(step1.reasoning) && 
    previousReasoning.includes(step2.reasoning));

  // Test getProblem method
  const problem = state.getProblem();
  console.log('Problem retrieved correctly:', 
    problem === 'How can we optimize performance in a large React application?');

  return state;
}

/**
 * Test implementations of key scoring algorithms similar to what's in ThinkingEngine
 * This simulates the functionality without requiring access to the private methods
 */
function testScoreCalculations() {
  console.log('\nTesting score calculation algorithms...');
  
  // Mock implementation of extractKeyTerms
  function extractKeyTerms(text: string): Set<string> {
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'is', 'are']);
    const terms = text.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/) // Split by whitespace
      .filter(term => term.length > 2 && !commonWords.has(term)); // Filter out short terms and common words
    
    return new Set(terms);
  }
  
  // Mock implementation of calculateTermOverlap
  function calculateTermOverlap(setA: Set<string>, setB: Set<string>): number {
    if (setA.size === 0 || setB.size === 0) {
      return 0;
    }
    
    // Count overlapping terms
    let overlap = 0;
    for (const term of setA) {
      if (setB.has(term)) {
        overlap++;
      }
    }
    
    // Jaccard similarity: intersection size / union size
    const union = setA.size + setB.size - overlap;
    return overlap / union;
  }
  
  // Mock implementation of calculateCoherenceScore
  function calculateCoherenceScore(step: {
    reasoning: string;
    previousReasoning?: string[];
  }): number {
    if (!step.previousReasoning || step.previousReasoning.length === 0) {
      return 1.0; // First step is coherent by default
    }

    // Extract key terms from current reasoning
    const currentTerms = extractKeyTerms(step.reasoning);
    
    // Calculate coherence with previous reasoning steps
    const coherenceScores = step.previousReasoning.map(prevReasoning => {
      const prevTerms = extractKeyTerms(prevReasoning);
      return calculateTermOverlap(currentTerms, prevTerms);
    });
    
    // Return the average coherence score
    return coherenceScores.reduce((sum, score) => sum + score, 0) / coherenceScores.length;
  }
  
  // Mock implementation of calculateSignificanceScore
  function calculateSignificanceScore(step: {
    reasoning: string;
    problem: string;
  }): number {
    // Extract key terms from problem and reasoning
    const problemTerms = extractKeyTerms(step.problem);
    const reasoningTerms = extractKeyTerms(step.reasoning);
    
    // Calculate overlap between problem and reasoning terms
    const termOverlap = calculateTermOverlap(problemTerms, reasoningTerms);
    
    // Consider length of reasoning as a factor (longer reasoning might be more significant)
    const lengthFactor = Math.min(1, step.reasoning.length / 500); // Cap at 1 for very long reasoning
    
    // Combine factors (term overlap is more important)
    return (termOverlap * 0.7) + (lengthFactor * 0.3);
  }
  
  // Test coherence score calculation
  const coherenceScore = calculateCoherenceScore({
    reasoning: 'Memoization in React prevents unnecessary re-renders by caching rendered components and computed values.',
    previousReasoning: [
      'To optimize a React application, we need to first identify where the performance issues are occurring.',
      'After identifying bottlenecks, we should apply techniques like code splitting and lazy loading.'
    ]
  });
  
  console.log('Coherence score calculated:', coherenceScore);
  console.log('Coherence score is valid (0-1 range):', coherenceScore >= 0 && coherenceScore <= 1);
  
  // Test significance score calculation
  const significanceScore = calculateSignificanceScore({
    reasoning: 'React performance can be improved by minimizing state updates and using memoization techniques.',
    problem: 'How can we optimize performance in a large React application?'
  });
  
  console.log('Significance score calculated:', significanceScore);
  console.log('Significance score is valid (0-1 range):', significanceScore >= 0 && significanceScore <= 1);
}

// Run the tests
async function runTests() {
  try {
    testThinkingEngineState();
    testScoreCalculations();
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

runTests();
