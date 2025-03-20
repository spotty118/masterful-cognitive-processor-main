/**
 * State management system for the ThinkingEngine
 * Enables tracking and dynamic adjustments during execution
 */
/**
 * Execution phase of the thinking process
 */
export var ExecutionPhase;
(function (ExecutionPhase) {
    ExecutionPhase["Initializing"] = "initializing";
    ExecutionPhase["ProblemAnalysis"] = "problem_analysis";
    ExecutionPhase["StrategySelection"] = "strategy_selection";
    ExecutionPhase["Execution"] = "execution";
    ExecutionPhase["Conclusion"] = "conclusion";
    ExecutionPhase["Error"] = "error";
    ExecutionPhase["Completed"] = "completed";
})(ExecutionPhase || (ExecutionPhase = {}));
/**
 * Represents current state of the thinking process
 */
export class ThinkingEngineState {
    phase = ExecutionPhase.Initializing;
    startTime = Date.now();
    steps = [];
    currentStepIndex = 0;
    problemId;
    originalProblem;
    processedProblem;
    problemType = 'general';
    metadata = new Map();
    initialTokenBudget;
    tokensUsed = 0;
    stepTokenUsage = new Map();
    maxSteps;
    reasoningSystemName;
    modelName;
    adjustments = new Map();
    adjustmentHistory = [];
    metrics = {
        confidence: 0,
        relevantConcepts: 0,
        identifiedChallenges: 0,
        hasAlternatives: false,
        complexityScore: 0
    };
    constructor(params) {
        this.problemId = params.problemId;
        this.originalProblem = params.problem;
        this.processedProblem = params.problem;
        this.initialTokenBudget = params.tokenBudget;
        this.maxSteps = params.maxSteps;
        this.modelName = params.model.name;
        this.reasoningSystemName = params.reasoningSystem.name;
    }
    getCurrentPhase() {
        return this.phase;
    }
    updateMetrics(metrics) {
        this.metrics = { ...this.metrics, ...metrics };
    }
    getProgressMetrics() {
        return this.metrics;
    }
    getAdjustments() {
        return this.adjustmentHistory.map(adj => ({
            type: adj.adjustment,
            timestamp: adj.timestamp,
            details: adj.details
        }));
    }
    setPhase(phase) {
        this.phase = phase;
    }
    addStep(step) {
        this.steps.push(step);
        if (step.id && step.tokens) {
            this.stepTokenUsage.set(step.id, step.tokens);
            this.tokensUsed += step.tokens;
        }
        this.currentStepIndex = this.steps.length;
    }
    recordAdjustment(type, details) {
        this.adjustmentHistory.push({
            timestamp: new Date().toISOString(),
            adjustment: type,
            trigger: 'system',
            details
        });
    }
    /**
     * Get all previous reasoning steps for coherence calculation
     * @returns Array of previous reasoning strings
     */
    getPreviousReasoning() {
        return this.steps.map(step => step.reasoning);
    }
    /**
     * Get the current problem for significance calculation
     * @returns The processed problem text
     */
    getProblem() {
        return this.processedProblem;
    }
}
//# sourceMappingURL=ThinkingEngineState.js.map