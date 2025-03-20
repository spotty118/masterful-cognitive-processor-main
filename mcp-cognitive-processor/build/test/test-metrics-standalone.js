/**
 * Standalone test script for metrics calculations
 * This script focuses solely on testing the metrics calculation algorithms
 * without relying on the ThinkingEngine or any other external dependencies
 */
// Simplified implementation of metrics calculation algorithms
// Based on the implementations in ThinkingEngine
/**
 * Calculate coherence score between reasoning steps
 * Measures logical connections between reasoning steps
 */
function calculateCoherenceScore(steps, currentStep, problem) {
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
 * Calculate complexity score of reasoning
 * Analyzes the complexity of reasoning based on sentence structure and terms
 */
function calculateComplexityScore(reasoning) {
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
 * Calculate significance score relative to original problem
 * Evaluates how relevant each reasoning step is to the original problem
 */
function calculateSignificanceScore(reasoning, problem) {
    if (!reasoning || !problem || reasoning.trim().length === 0 || problem.trim().length === 0) {
        return 0.5; // Default value
    }
    // Extract key terms from problem statement
    const problemTerms = new Set(problem.toLowerCase()
        .split(/\s+/)
        .filter(term => term.length > 3)
        .map(term => term.replace(/[.,!?;:(){}[\]'"]/g, '')));
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
// Create test data for metrics evaluation
const problem = 'How to optimize a recursive algorithm for calculating Fibonacci numbers?';
const steps = [
    {
        id: 'step-1',
        description: 'Identify the problem',
        reasoning: 'The standard recursive algorithm for Fibonacci has exponential time complexity O(2^n) because it calculates the same values multiple times.',
        tokens: 50,
        status: 'completed',
        timestamp: new Date().toISOString()
    },
    {
        id: 'step-2',
        description: 'Consider memoization',
        reasoning: 'By using memoization, we can store previously calculated Fibonacci values in a cache, which reduces the time complexity to O(n).',
        tokens: 60,
        status: 'completed',
        timestamp: new Date().toISOString()
    },
    {
        id: 'step-3',
        description: 'Implement iterative solution',
        reasoning: 'An iterative approach using dynamic programming can also achieve O(n) time complexity while using constant O(1) space by only storing the two most recent values.',
        tokens: 70,
        status: 'completed',
        timestamp: new Date().toISOString()
    }
];
// Test function
function testMetricsCalculation() {
    console.log('Starting standalone metrics calculation test...');
    console.log(`Problem: ${problem}\n`);
    // Calculate and display metrics for each step
    for (const step of steps) {
        console.log(`\n--- Step: ${step.description} ---`);
        console.log(`Reasoning: ${step.reasoning}`);
        // Calculate and display metrics
        const coherence = calculateCoherenceScore(steps, step, problem);
        const complexity = calculateComplexityScore(step.reasoning);
        const significance = calculateSignificanceScore(step.reasoning, problem);
        console.log('\nMetrics:');
        console.log(`- Coherence: ${coherence.toFixed(4)}`);
        console.log(`- Complexity: ${complexity.toFixed(4)}`);
        console.log(`- Significance: ${significance.toFixed(4)}`);
        // Store metrics on the step
        step.metrics = {
            coherence,
            complexity,
            significanceScore: significance
        };
    }
    console.log('\n--- Summary of All Steps with Metrics ---');
    for (const step of steps) {
        console.log(`\nStep: ${step.description}`);
        console.log('Metrics:');
        // Use nullish coalescing to handle possibly undefined metrics
        console.log(`- Coherence: ${step.metrics?.coherence?.toFixed(4) ?? 'Not calculated'}`);
        console.log(`- Complexity: ${step.metrics?.complexity?.toFixed(4) ?? 'Not calculated'}`);
        console.log(`- Significance: ${step.metrics?.significanceScore?.toFixed(4) ?? 'Not calculated'}`);
    }
    console.log('\nStandalone metrics test completed successfully!');
}
// Run the test
testMetricsCalculation();
export {};
//# sourceMappingURL=test-metrics-standalone.js.map