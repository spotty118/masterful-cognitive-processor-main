/**
 * Core thinking engine that powers cognitive processing
 * Implements different thinking strategies and reasoning systems
 * Enhanced with state management for dynamic adjustments during execution
 */
import { OpenRouterService } from '../services/OpenRouterService.js';
import { ThinkingEngineState } from './ThinkingEngineState.js';
export class ThinkingEngine {
    config;
    tokenOptimizer;
    currentStrategy = null;
    reasoningStrategySelector = null;
    openRouterService = null;
    engineState = null;
    // Constants for configuration
    static DEFAULT_MAX_TOKENS_PER_STEP = 1000;
    static DEFAULT_TOKEN_USAGE_THRESHOLD = 0.8;
    static TOKEN_CACHE_SIZE = 100;
    static COHERENCE_THRESHOLD = 0.7;
    static MAX_PREVIOUS_STEPS = 3;
    constructor(config, tokenOptimizer, strategySelector, openRouterService) {
        this.config = config;
        this.tokenOptimizer = tokenOptimizer;
        this.initializeServices(strategySelector, openRouterService);
    }
    /**
     * Initialize services with proper error handling and fallbacks
     */
    async initializeServices(strategySelector, openRouterService) {
        // Initialize strategy selector
        if (strategySelector) {
            this.reasoningStrategySelector = strategySelector;
        }
        else {
            await this.initializeStrategySelector();
        }
        // Initialize token optimizer
        await this.initializeTokenOptimizer();
        // Initialize OpenRouter service
        this.openRouterService = openRouterService ||
            await OpenRouterService.getInstance(process.env.OPENROUTER_API_KEY || '');
    }
    /**
     * Initialize strategy selector with improved error handling and fallbacks
     */
    async initializeStrategySelector() {
        try {
            const { AdvancedStrategySelector } = await import('../services/strategySelectors/AdvancedStrategySelector.js');
            this.reasoningStrategySelector = new AdvancedStrategySelector(this.config);
        }
        catch (error) {
            console.warn('Falling back to default strategy selector:', error);
            try {
                const { DefaultReasoningStrategySelector } = await import('../services/strategySelectors/DefaultReasoningStrategySelector.js');
                this.reasoningStrategySelector = new DefaultReasoningStrategySelector(this.config);
            }
            catch (fallbackError) {
                console.error('Using emergency fallback selector:', fallbackError);
                this.reasoningStrategySelector = this.createEmergencySelector();
            }
        }
    }
    /**
     * Create emergency fallback selector when other options fail
     */
    createEmergencySelector() {
        return {
            selectReasoningSystem: async () => ({
                name: 'chain_of_thought',
                description: 'Emergency fallback reasoning system',
                implementation: 'chain_of_thought_strategy'
            })
        };
    }
    /**
     * Initialize token optimizer with error handling
     */
    async initializeTokenOptimizer() {
        try {
            await this.tokenOptimizer.init();
        }
        catch (error) {
            console.error('Failed to initialize token optimizer:', error);
            // Continue with limited optimization capability
        }
    }
    /**
     * Process a problem using selected reasoning system
     */
    async processProblem(problem, model, options = {}) {
        const startTime = Date.now();
        const problemId = this.generateProblemId();
        try {
            // Initialize state and strategy
            await this.initializeProcessing(problem, model, options, problemId);
            // Process the problem
            const result = await this.executeProcessing(problem, model, options);
            // Finalize processing and return results
            return this.finalizeProcessing(result, startTime);
        }
        catch (error) {
            return this.handleProcessingError(error, startTime, problemId);
        }
    }
    /**
     * Initialize the problem processing state
     */
    async initializeProcessing(problem, model, options, problemId) {
        const initialSystemResult = await this.selectReasoningSystem(problem);
        const reasoningSystem = typeof initialSystemResult === 'string' ? {
            name: 'default',
            description: 'Default reasoning system',
            implementation: initialSystemResult
        } : initialSystemResult;
        this.engineState = new ThinkingEngineState({
            problemId,
            problem,
            tokenBudget: this.calculateTokenBudget(model, options),
            maxSteps: options.maxSteps || 10,
            model,
            reasoningSystem,
            enableDynamicAdjustment: options.enableDynamicAdjustment !== false
        });
    }
    /**
     * Execute the main problem processing logic
     */
    async executeProcessing(problem, model, options) {
        const steps = [];
        const reasoning = [];
        let totalTokens = 0;
        const startTime = Date.now();
        // Execute steps
        const maxSteps = options.maxSteps || 10;
        for (let currentStep = 1; currentStep <= maxSteps; currentStep++) {
            const stepResult = await this.executeThinkingStep(problem, steps, reasoning, currentStep, model, options);
            if (stepResult.shouldStop)
                break;
            steps.push({
                id: stepResult.step.id,
                description: stepResult.step.description,
                reasoning: stepResult.step.reasoning,
                tokens: stepResult.step.tokens,
                status: stepResult.step.status,
                timestamp: new Date(stepResult.step.timestamp).toISOString()
            });
            reasoning.push(stepResult.reasoning);
            totalTokens += stepResult.tokens;
        }
        const executionTime = Date.now() - startTime;
        const stateMetrics = this.engineState ? {
            adjustments: this.engineState.getAdjustments(),
            progressMetrics: this.engineState.getProgressMetrics(),
            finalState: this.engineState.getCurrentPhase()
        } : undefined;
        const optimization = options.optimizeTokens ? {
            strategy: 'token_optimization',
            tokenSavings: Math.round(totalTokens * 0.2), // Estimated savings
            optimizedProblem: problem
        } : undefined;
        return {
            steps,
            reasoning,
            tokenUsage: totalTokens,
            executionTime,
            stateMetrics,
            optimization
        };
    }
    /**
     * Execute a single thinking step
     */
    async executeThinkingStep(problem, steps, reasoning, currentStep, model, options) {
        const stepContext = this.prepareStepContext(problem, steps, reasoning, currentStep, options.maxSteps || 10);
        const optimizedContext = await this.optimizeContext(stepContext, model, options);
        try {
            const response = await this.queryModel(optimizedContext, model);
            const analysis = this.analyzeModelResponse(response);
            return this.processStepResults(analysis, currentStep, model);
        }
        catch (error) {
            return this.handleStepError(error, currentStep);
        }
    }
    /**
     * Analyze model response with improved error handling and validation
     */
    analyzeModelResponse(modelResponse) {
        try {
            const parsedResponse = this.parseModelResponse(modelResponse);
            return {
                suggestedStepDescription: this.extractStepDescription(parsedResponse),
                insights: this.extractInsights(parsedResponse),
                shouldContinue: this.shouldContinueProcessing(parsedResponse),
                confidence: this.extractConfidence(parsedResponse),
                alternativeSuggestions: this.extractAlternatives(parsedResponse),
                identifiedChallenges: this.extractChallenges(parsedResponse),
                relevantConcepts: this.extractConcepts(parsedResponse)
            };
        }
        catch (error) {
            console.error('Error analyzing model response:', error);
            return this.createFallbackAnalysis();
        }
    }
    /**
     * Parse and validate model response
     */
    parseModelResponse(modelResponse) {
        if (!modelResponse?.response) {
            throw new Error('Invalid model response structure');
        }
        return typeof modelResponse.response === 'string' ?
            JSON.parse(modelResponse.response) : modelResponse.response;
    }
    /**
     * Extract step description from parsed response
     */
    extractStepDescription(parsedResponse) {
        return (parsedResponse.steps?.[0]?.description ||
            parsedResponse.description ||
            "Continue analysis");
    }
    /**
     * Extract insights from parsed response
     */
    extractInsights(parsedResponse) {
        const insights = [];
        if (parsedResponse.steps?.[0]?.reasoning) {
            insights.push(parsedResponse.steps[0].reasoning);
        }
        if (parsedResponse.insights) {
            insights.push(...(Array.isArray(parsedResponse.insights) ?
                parsedResponse.insights : [parsedResponse.insights]));
        }
        if (parsedResponse.analysis) {
            insights.push(...this.extractInsightsFromAnalysis(parsedResponse.analysis));
        }
        return insights;
    }
    /**
     * Extract insights from analysis section
     */
    extractInsightsFromAnalysis(analysis) {
        const sections = ['key_points', 'recommendations', 'observations'];
        const extractedInsights = [];
        if (typeof analysis === 'string') {
            return [analysis];
        }
        if (typeof analysis === 'object') {
            for (const section of sections) {
                if (analysis[section]) {
                    extractedInsights.push(...(Array.isArray(analysis[section]) ?
                        analysis[section] : [analysis[section]]));
                }
            }
        }
        return extractedInsights;
    }
    /**
     * Determine if processing should continue
     */
    shouldContinueProcessing(parsedResponse) {
        return parsedResponse.shouldContinue !== undefined ?
            parsedResponse.shouldContinue : true;
    }
    /**
     * Extract confidence score from parsed response
     */
    extractConfidence(parsedResponse) {
        return parsedResponse.confidence !== undefined ?
            parsedResponse.confidence :
            parsedResponse.steps?.[0]?.confidence !== undefined ?
                parsedResponse.steps[0].confidence : 0.7;
    }
    /**
     * Extract alternative suggestions from parsed response
     */
    extractAlternatives(parsedResponse) {
        return parsedResponse.alternatives ?
            Array.isArray(parsedResponse.alternatives) ?
                parsedResponse.alternatives : [parsedResponse.alternatives] : [];
    }
    /**
     * Extract challenges from parsed response
     */
    extractChallenges(parsedResponse) {
        return parsedResponse.challenges ?
            Array.isArray(parsedResponse.challenges) ?
                parsedResponse.challenges : [parsedResponse.challenges] : [];
    }
    /**
     * Extract relevant concepts from parsed response
     */
    extractConcepts(parsedResponse) {
        return parsedResponse.concepts ?
            Array.isArray(parsedResponse.concepts) ?
                parsedResponse.concepts : [parsedResponse.concepts] : [];
    }
    /**
     * Create fallback analysis for error cases
     */
    createFallbackAnalysis() {
        return {
            suggestedStepDescription: "Continue analysis",
            insights: [],
            shouldContinue: true,
            confidence: 0.7,
            alternativeSuggestions: [],
            identifiedChallenges: [],
            relevantConcepts: []
        };
    }
    /**
     * Process step results and update engine state
     */
    processStepResults(analysis, currentStep, model) {
        if (!this.engineState) {
            throw new Error('Engine state not initialized');
        }
        const reasoning = analysis.insights.join('\n');
        const previousReasoning = this.engineState.getPreviousReasoning();
        const problem = this.engineState.getProblem();
        const step = {
            id: `step_${currentStep}_${Date.now()}`,
            tokens: 0,
            description: analysis.suggestedStepDescription,
            reasoning: reasoning,
            confidence: analysis.confidence || 0.7,
            challenges: analysis.identifiedChallenges || [],
            concepts: analysis.relevantConcepts || [],
            status: 'completed',
            timestamp: new Date().toISOString(),
            metrics: {
                coherence: this.calculateCoherenceScore({
                    reasoning: reasoning,
                    previousReasoning: previousReasoning
                }),
                complexity: this.calculateComplexityScore({
                    reasoning: reasoning,
                    confidence: analysis.confidence || 0.7,
                    challenges: analysis.identifiedChallenges || [],
                    concepts: analysis.relevantConcepts || []
                }),
                significanceScore: this.calculateSignificanceScore({
                    reasoning: reasoning,
                    problem: problem
                })
            }
        };
        const tokens = this.estimateStepTokens(step, model);
        step.tokens = tokens;
        const metrics = {
            confidence: step.confidence,
            relevantConcepts: step.concepts.length,
            identifiedChallenges: step.challenges.length,
            hasAlternatives: Boolean(analysis.alternativeSuggestions?.length),
            complexityScore: step.metrics?.complexity || 0,
            significanceScore: step.metrics?.significanceScore || 0
        };
        this.engineState.updateMetrics(metrics);
        return {
            step,
            reasoning: step.reasoning,
            tokens,
            shouldStop: !analysis.shouldContinue
        };
    }
    /**
     * Calculate coherence score for a step
     * Measures logical connections between reasoning steps by analyzing shared key terms and phrases
     */
    calculateCoherenceScore(step) {
        if (!step.previousReasoning || step.previousReasoning.length === 0) {
            return 1.0; // First step is coherent by default
        }
        // Extract key terms from current reasoning
        const currentTerms = this.extractKeyTerms(step.reasoning);
        // Calculate coherence with previous reasoning steps
        const coherenceScores = step.previousReasoning.map(prevReasoning => {
            const prevTerms = this.extractKeyTerms(prevReasoning);
            return this.calculateTermOverlap(currentTerms, prevTerms);
        });
        // Return the average coherence score
        return coherenceScores.reduce((sum, score) => sum + score, 0) / coherenceScores.length;
    }
    /**
     * Extract key terms from reasoning text
     * @private
     */
    extractKeyTerms(text) {
        // Simple implementation - split by spaces and filter out common words
        const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'is', 'are']);
        const terms = text.toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .split(/\s+/) // Split by whitespace
            .filter(term => term.length > 2 && !commonWords.has(term)); // Filter out short terms and common words
        return new Set(terms);
    }
    /**
     * Calculate term overlap between two sets of terms
     * @private
     */
    calculateTermOverlap(setA, setB) {
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
    /**
     * Calculate significance score for a step
     * Evaluates how relevant each reasoning step is to the original problem
     */
    calculateSignificanceScore(step) {
        // Extract key terms from problem and reasoning
        const problemTerms = this.extractKeyTerms(step.problem);
        const reasoningTerms = this.extractKeyTerms(step.reasoning);
        // Calculate overlap between problem and reasoning terms
        const termOverlap = this.calculateTermOverlap(problemTerms, reasoningTerms);
        // Consider length of reasoning as a factor (longer reasoning might be more significant)
        const lengthFactor = Math.min(1, step.reasoning.length / 500); // Cap at 1 for very long reasoning
        // Combine factors (term overlap is more important)
        return (termOverlap * 0.7) + (lengthFactor * 0.3);
    }
    /**
     * Calculate complexity score for a step
     */
    calculateComplexityScore(step) {
        const factors = [
            step.reasoning.length / 100, // Length factor
            step.challenges.length * 0.2, // Challenges factor
            step.concepts.length * 0.1, // Concepts factor
            1 - step.confidence // Uncertainty factor
        ];
        return Math.min(1, factors.reduce((sum, factor) => sum + factor, 0) / factors.length);
    }
    /**
     * Estimate token usage for a step
     */
    estimateStepTokens(step, model) {
        return this.tokenOptimizer.estimateTokenCount(JSON.stringify(step), model.name);
    }
    /**
     * Handle step execution errors
     */
    handleStepError(error, currentStep) {
        console.error(`Error in step ${currentStep}:`, error);
        const errorStep = {
            id: `error_${currentStep}_${Date.now()}`,
            tokens: 0,
            description: "Error occurred during processing",
            reasoning: `Processing error: ${error.message}`,
            confidence: 0,
            challenges: ["Execution failed"],
            concepts: [],
            status: 'error',
            timestamp: new Date().toISOString(),
            metrics: {
                coherence: 0,
                complexity: 1
            }
        };
        return {
            step: errorStep,
            reasoning: errorStep.reasoning,
            tokens: 0,
            shouldStop: true
        };
    }
    /**
     * Handle processing errors at the problem level
     */
    handleProcessingError(error, startTime, problemId) {
        console.error(`Error processing problem ${problemId}:`, error);
        return {
            steps: [],
            reasoning: [`Processing error: ${error.message}`],
            tokenUsage: 0,
            executionTime: Date.now() - startTime,
            stateMetrics: {
                adjustments: [],
                progressMetrics: {
                    confidence: 0,
                    relevantConcepts: 0,
                    identifiedChallenges: 1,
                    hasAlternatives: false,
                    complexityScore: 1
                },
                finalState: 'error'
            }
        };
    }
    /**
     * Finalize processing and prepare results
     */
    finalizeProcessing(result, startTime) {
        if (!this.engineState) {
            throw new Error('Engine state not initialized');
        }
        return {
            ...result,
            executionTime: Date.now() - startTime,
            stateMetrics: {
                adjustments: this.engineState.getAdjustments(),
                progressMetrics: this.engineState.getProgressMetrics(),
                finalState: this.engineState.getCurrentPhase()
            }
        };
    }
    /**
     * Build context for a thinking step
     */
    buildStepContext(problem, relevantContext, currentStep, maxSteps) {
        return `
      Problem: ${problem}

      Previous steps:
      ${relevantContext.steps.map((step, index) => `Step ${index + 1}: ${step.description}\n${step.reasoning}`).join('\n\n')}

      Current step ${currentStep} of ${maxSteps}:
      Please analyze the problem and previous steps to determine the next step.
    `;
    }
    /**
     * Query the AI model with proper error handling
     */
    async queryModel(context, model) {
        try {
            if (!this.openRouterService) {
                throw new Error('OpenRouter service not initialized');
            }
            const response = await this.openRouterService.query({
                model: model.name,
                messages: [{ role: "user", content: context }],
                maxTokens: ThinkingEngine.DEFAULT_MAX_TOKENS_PER_STEP,
                temperature: 0.7
            });
            return response;
        }
        catch (error) {
            console.error('Error querying model:', error);
            throw error;
        }
    }
    /**
     * Optimize context using token optimizer
     */
    async optimizeContext(context, model, options) {
        if (!options.optimizeTokens) {
            return context;
        }
        const optimization = await this.tokenOptimizer.optimizeTokenUsage(context, {
            available_tokens: ThinkingEngine.DEFAULT_MAX_TOKENS_PER_STEP,
            user_selected_model: model.name
        });
        return optimization.optimized_prompt || context;
    }
    /**
     * Select reasoning system based on problem analysis
     */
    async selectReasoningSystem(problem) {
        if (!this.reasoningStrategySelector) {
            throw new Error('Reasoning strategy selector not initialized');
        }
        const selectedSystem = await this.reasoningStrategySelector.selectReasoningSystem(problem);
        return selectedSystem.implementation;
    }
    /**
     * Utility method to generate unique problem ID
     */
    generateProblemId() {
        return `problem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    /**
     * Calculate token budget based on model and options
     */
    calculateTokenBudget(model, options) {
        return options.optimizeTokens ? (model.maxTokens || 4096) : 8192;
    }
    /**
     * Prepare context for a thinking step
     */
    prepareStepContext(problem, steps, reasoning, currentStep, maxSteps) {
        return this.buildStepContext(problem, this.selectRelevantSteps(steps, reasoning), currentStep, maxSteps);
    }
    /**
     * Select relevant previous steps for context
     */
    selectRelevantSteps(steps, reasoning) {
        if (steps.length <= ThinkingEngine.MAX_PREVIOUS_STEPS) {
            return { steps, reasoning };
        }
        return {
            steps: [
                steps[0],
                ...steps.slice(-ThinkingEngine.MAX_PREVIOUS_STEPS + 1)
            ],
            reasoning: [
                reasoning[0],
                ...reasoning.slice(-ThinkingEngine.MAX_PREVIOUS_STEPS + 1)
            ]
        };
    }
}
//# sourceMappingURL=ThinkingEngine.js.map