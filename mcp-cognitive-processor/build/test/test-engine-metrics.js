/**
 * Simplified test script focused on ThinkingEngine metrics
 * This script specifically tests the integration of metrics calculations
 * without depending on the full pipeline or service initialization
 */
import { ThinkingEngine } from '../core/ThinkingEngine.js';
import { ThinkingEngineState } from '../core/ThinkingEngineState.js';
import { TokenOptimizerImpl } from '../utils/TokenOptimizerImpl.js';
// Load environment variables
import dotenv from 'dotenv';
dotenv.config();
async function testEngineMetrics() {
    console.log('Starting ThinkingEngine metrics test...');
    try {
        // Create a minimal config object with required fields
        const config = {
            name: 'Metrics Test',
            version: '1.0.0',
            description: 'Test configuration for metrics',
            defaultModel: {
                name: 'test-model',
                maxTokens: 2000,
                temperature: 0.7
            },
            maxStepsPerStrategy: 5,
            tokenBudget: 10000,
            memoryPath: './memory',
            cachePath: './cache',
            optimizationThreshold: 0.7,
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
                systemType: 'associative',
                components: [{
                        name: 'short-term',
                        description: 'Short-term memory module',
                        capacity: 'limited',
                        persistenceLevel: 'temporary'
                    }]
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
                pipelineSteps: [
                    {
                        name: 'Initial Preprocessing',
                        description: 'Gemini Flash preprocesses and structures the query',
                        service: 'googleflash',
                        priority: 1
                    },
                    {
                        name: 'Advanced Preprocessing',
                        description: 'Gemini Pro further refines the problem structure',
                        service: 'gemini',
                        priority: 2
                    },
                    {
                        name: 'Preliminary Reasoning',
                        description: 'DeepSeek performs initial reasoning steps and problem analysis',
                        service: 'deepseek',
                        priority: 3
                    },
                    {
                        name: 'Final Reasoning',
                        description: 'Claude provides final detailed reasoning and solution',
                        service: 'claude',
                        priority: 4
                    }
                ]
            }
        };
        // Initialize state for testing
        const state = new ThinkingEngineState({
            problemId: 'metrics-test-1',
            problem: 'How to optimize a recursive algorithm for calculating Fibonacci numbers?',
            tokenBudget: 5000,
            maxSteps: 10,
            model: config.defaultModel,
            reasoningSystem: {
                name: 'test-system',
                description: 'Test reasoning system',
                implementation: 'hybrid'
            }
        });
        // Get the TokenOptimizer singleton instance
        const tokenOptimizer = TokenOptimizerImpl.getInstance();
        console.log('Initializing ThinkingEngine...');
        const engine = new ThinkingEngine(config, tokenOptimizer);
        // Need to give the engine time to initialize its services
        console.log('Waiting for ThinkingEngine services to initialize...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Add test steps to the state
        const step1 = await state.addStep({
            id: 'step-1',
            description: 'Identify the problem',
            reasoning: 'The standard recursive algorithm for Fibonacci has exponential time complexity O(2^n) because it calculates the same values multiple times.',
            tokens: 50,
            status: 'completed',
            timestamp: new Date().toISOString()
        });
        const step2 = await state.addStep({
            id: 'step-2',
            description: 'Consider memoization',
            reasoning: 'By using memoization, we can store previously calculated Fibonacci values in a cache, which reduces the time complexity to O(n).',
            tokens: 60,
            status: 'completed',
            timestamp: new Date().toISOString(),
            metrics: {
                coherence: 0.8,
                complexity: 0.7,
                significanceScore: 0.85
            }
        });
        const step3 = await state.addStep({
            id: 'step-3',
            description: 'Implement iterative solution',
            reasoning: 'An iterative approach using dynamic programming can also achieve O(n) time complexity while using constant O(1) space by only storing the two most recent values.',
            tokens: 70,
            status: 'completed',
            timestamp: new Date().toISOString()
        });
        // Manually calculate metrics for testing purposes
        console.log('\nCalculating metrics for reasoning steps...');
        // Get steps from state
        const steps = state.steps || [];
        console.log(`Number of steps: ${steps.length}`);
        for (const step of steps) {
            // If metrics are already defined, skip calculation
            if (!step.metrics) {
                step.metrics = {};
            }
            // Calculate metrics if they don't already exist
            if (step.metrics.coherence === undefined) {
                // Testing coherence score calculation
                try {
                    step.metrics.coherence = await engine.calculateCoherenceScore(steps, step, 'How to optimize a recursive algorithm for calculating Fibonacci numbers?');
                    console.log(`Coherence score for ${step.description}: ${step.metrics.coherence}`);
                }
                catch (error) {
                    console.error(`Error calculating coherence for ${step.description}:`, error);
                }
            }
            if (step.metrics.complexity === undefined) {
                // Testing complexity score calculation
                try {
                    step.metrics.complexity = await engine.calculateComplexityScore(step.reasoning);
                    console.log(`Complexity score for ${step.description}: ${step.metrics.complexity}`);
                }
                catch (error) {
                    console.error(`Error calculating complexity for ${step.description}:`, error);
                }
            }
            if (step.metrics.significanceScore === undefined) {
                // Testing significance score calculation
                try {
                    step.metrics.significanceScore = await engine.calculateSignificanceScore(step.reasoning, 'How to optimize a recursive algorithm for calculating Fibonacci numbers?');
                    console.log(`Significance score for ${step.description}: ${step.metrics.significanceScore}`);
                }
                catch (error) {
                    console.error(`Error calculating significance for ${step.description}:`, error);
                }
            }
        }
        // Output the final state with all metrics
        console.log('\n--- FINAL STATE WITH METRICS ---');
        for (const step of steps) {
            console.log(`\nStep: ${step.description}`);
            console.log(`Reasoning: ${step.reasoning.substring(0, 50)}...`);
            console.log('Metrics:');
            console.log(`- Coherence: ${step.metrics?.coherence || 'Not calculated'}`);
            console.log(`- Complexity: ${step.metrics?.complexity || 'Not calculated'}`);
            console.log(`- Significance: ${step.metrics?.significanceScore || 'Not calculated'}`);
        }
        console.log('\nMetrics test completed successfully!');
    }
    catch (error) {
        console.error('An error occurred during the test:', error);
    }
}
// Run the test
testEngineMetrics().catch(error => {
    console.error('Unhandled error in test execution:', error);
});
//# sourceMappingURL=test-engine-metrics.js.map