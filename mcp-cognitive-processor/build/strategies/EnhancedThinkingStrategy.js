/**
 * Enhanced thinking strategy implementation
 * Implements advanced reasoning with confidence scoring, alternative paths,
 * and detailed metrics tracking
 */
import { BaseThinkingStrategy } from './BaseThinkingStrategy.js';
export class EnhancedThinkingStrategy extends BaseThinkingStrategy {
    problem = '';
    currentPhase = 0;
    phases = [
        'analyze',
        'explore_alternatives',
        'evaluate_approaches',
        'plan',
        'execute',
        'validate',
        'reflect'
    ];
    completed = false;
    alternativePaths = [];
    currentConfidence = 0;
    uncertaintyFactors = [];
    complexityScore = 0;
    constructor(model, tokenOptimizer) {
        super(model, tokenOptimizer);
    }
    async initialize(problem) {
        this.problem = await this.optimizeContent(problem);
        this.currentPhase = 0;
        this.completed = false;
        this.steps = [];
        this.alternativePaths = [];
        this.currentConfidence = 0;
        this.uncertaintyFactors = [];
        // Initial complexity analysis
        this.complexityScore = await this.analyzeComplexity(problem);
    }
    async executeNextStep() {
        const phase = this.phases[this.currentPhase];
        let step;
        switch (phase) {
            case 'analyze':
                step = await this.analyzeStep();
                break;
            case 'explore_alternatives':
                step = await this.exploreAlternativesStep();
                break;
            case 'evaluate_approaches':
                step = await this.evaluateApproachesStep();
                break;
            case 'plan':
                step = await this.planStep();
                break;
            case 'execute':
                step = await this.executeStep();
                break;
            case 'validate':
                step = await this.validateStep();
                break;
            case 'reflect':
                step = await this.reflectStep();
                this.completed = true;
                break;
            default:
                throw new Error('Invalid phase');
        }
        // Update confidence based on step results
        const enhancedStep = step;
        this.currentConfidence = await this.calculateStepConfidence(enhancedStep);
        this.addStep(step);
        if (this.currentPhase < this.phases.length - 1) {
            this.currentPhase++;
        }
        return step;
    }
    shouldContinue() {
        return !this.completed;
    }
    getProgress() {
        return (this.currentPhase + 1) / this.phases.length;
    }
    async getMetrics() {
        const currentPath = this.steps;
        return {
            confidence: this.currentConfidence,
            reasoning: await this.explainConfidence(),
            alternativePaths: this.alternativePaths,
            tokenEfficiency: await this.computeStepTokenEfficiency(),
            complexityScore: this.complexityScore
        };
    }
    async generateAlternativePaths(count) {
        const alternatives = [];
        for (let i = 0; i < count; i++) {
            const path = await this.generateAlternativePath();
            if (path) {
                alternatives.push(path);
            }
        }
        this.alternativePaths = alternatives;
        return alternatives;
    }
    async calculateConfidence() {
        return this.currentConfidence;
    }
    async explainConfidence() {
        const factors = [
            `Problem complexity score: ${this.complexityScore}`,
            `Current phase confidence: ${this.currentConfidence}`,
            `Number of alternative paths explored: ${this.alternativePaths.length}`,
            ...this.uncertaintyFactors
        ];
        return `Confidence Analysis:\n${factors.join('\n')}`;
    }
    async compareAlternativePaths() {
        const differences = [];
        const tradeoffs = {};
        // Compare current path with alternatives
        this.alternativePaths.forEach((path, index) => {
            differences.push(`Path ${index + 1} differs in: ${this.analyzeDifferences(path)}`);
            const pathTradeoffs = this.analyzeTradeoffs(path);
            tradeoffs[`path_${index + 1}`] = pathTradeoffs;
        });
        // Generate recommendation based on confidence and tradeoffs
        const recommendation = await this.generateRecommendation();
        return { differences, tradeoffs, recommendation };
    }
    async analyzeComplexity(problem) {
        // Analyze problem complexity based on various factors
        const factors = [
            this.countKeyComponents(problem),
            this.assessInteractions(problem),
            this.evaluateConstraints(problem)
        ];
        return factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
    }
    countKeyComponents(problem) {
        const components = problem.split(/[.!?]+/).filter(Boolean);
        return Math.min(components.length / 5, 1);
    }
    assessInteractions(problem) {
        const interactionPatterns = [
            /interact|between|relationship|dependency/gi,
            /if.*then|when.*then/gi,
            /cause.*effect|impact/gi
        ];
        const matches = interactionPatterns.flatMap(pattern => (problem.match(pattern) || []));
        const matchCount = matches.length;
        return Math.min(matchCount / 5, 1);
    }
    evaluateConstraints(problem) {
        const constraintPatterns = [
            /must|should|need to|required|cannot|should not/gi,
            /constraint|limitation|restriction/gi,
            /only|except|unless/gi
        ];
        const matches = constraintPatterns.flatMap(pattern => (problem.match(pattern) || []));
        const matchCount = matches.length;
        return Math.min(matchCount / 5, 1);
    }
    async calculateStepConfidence(step) {
        const factors = [
            step.metrics?.complexityScore || 0.5,
            step.metrics?.tokenEfficiency || 0.5,
            this.assessStepCompleteness(step),
            this.evaluateStepCohesion(step)
        ];
        return factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
    }
    assessStepCompleteness(step) {
        const requiredElements = [
            'description',
            'reasoning',
            'metrics'
        ];
        const presentElements = requiredElements.filter(element => {
            const key = element;
            return step[key] !== undefined && step[key] !== null;
        });
        return presentElements.length / requiredElements.length;
    }
    evaluateStepCohesion(step) {
        // Make sure description and reasoning are strings before processing
        const description = typeof step.description === 'string' ? step.description.toLowerCase() : '';
        const reasoning = typeof step.reasoning === 'string' ? step.reasoning.toLowerCase() : '';
        // Check if reasoning supports description
        const keywords = description
            .split(/\s+/)
            .filter(word => word.length > 3);
        if (keywords.length === 0)
            return 1.0; // Avoid division by zero
        const matchingKeywords = keywords.filter(word => reasoning.includes(word));
        return matchingKeywords.length / keywords.length;
    }
    async generateAlternativePath() {
        // Generate alternative approach with varying parameters
        const baseConfidence = Math.random() * 0.3 + 0.5; // 0.5 to 0.8
        const alternativeSteps = this.steps.map(step => ({
            ...step,
            description: `Alternative: ${step.description}`,
            reasoning: `Alternative reasoning: ${step.reasoning}`
        }));
        return {
            steps: alternativeSteps,
            confidence: baseConfidence,
            reasoning: `Alternative path with ${baseConfidence.toFixed(2)} confidence`
        };
    }
    analyzeDifferences(path) {
        const currentSteps = this.steps;
        const differences = [];
        path.steps.forEach((step, index) => {
            if (index < currentSteps.length) {
                const currentStep = currentSteps[index];
                if (step.description !== currentStep.description) {
                    differences.push(`Step ${index + 1} approach`);
                }
                if (step.reasoning !== currentStep.reasoning) {
                    differences.push(`Step ${index + 1} reasoning`);
                }
            }
        });
        return differences.join(', ');
    }
    analyzeTradeoffs(path) {
        const tradeoffs = [];
        // Compare confidence
        if (path.confidence > this.currentConfidence) {
            tradeoffs.push('Higher confidence but may be more complex');
        }
        else {
            tradeoffs.push('Lower confidence but may be simpler');
        }
        // Compare step count
        if (path.steps.length < this.steps.length) {
            tradeoffs.push('Fewer steps but may miss details');
        }
        else {
            tradeoffs.push('More thorough but requires more steps');
        }
        return tradeoffs.join('; ');
    }
    async generateRecommendation() {
        const currentPathMetrics = await this.getMetrics();
        let recommendation = 'Current path is recommended: ';
        const alternativeAdvantages = this.alternativePaths.filter(path => path.confidence > this.currentConfidence);
        if (alternativeAdvantages.length > 0) {
            // Only reduce if we have at least one alternative
            const bestAlternative = alternativeAdvantages.length === 1
                ? alternativeAdvantages[0]
                : alternativeAdvantages.reduce((best, current) => current.confidence > best.confidence ? current : best);
            recommendation = `Alternative path ${this.alternativePaths.indexOf(bestAlternative) + 1} is recommended: `;
            recommendation += `Higher confidence (${bestAlternative.confidence.toFixed(2)} vs ${this.currentConfidence.toFixed(2)})`;
        }
        else {
            recommendation += `Highest confidence (${this.currentConfidence.toFixed(2)})`;
        }
        return recommendation;
    }
    async computeStepTokenEfficiency() {
        const totalTokens = this.steps.reduce((sum, step) => sum + (step.tokens || 0), 0);
        const progress = this.getProgress();
        // Enhanced version with better normalization and minimum efficiency
        return Math.max(0.1, Math.min(1.0, progress / (totalTokens / 1000)));
    }
    // Enhanced step implementations with metrics
    async analyzeStep() {
        const description = 'Analyzing problem complexity and uncertainty factors';
        const reasoning = `Evaluating "${this.problem}" for key components, interactions, and constraints`;
        const tokens = this.calculateTokenUsage(description + reasoning);
        const baseStep = await this.createStep(description, reasoning, tokens);
        // Create enhanced step with proper type
        const enhancedStep = {
            ...baseStep,
            confidence: 0.7,
            metrics: {
                complexityScore: this.complexityScore,
                tokenEfficiency: 1.0
            }
        };
        return enhancedStep;
    }
    async exploreAlternativesStep() {
        const alternatives = await this.generateAlternativePaths(3);
        const description = 'Exploring alternative solution approaches';
        const reasoning = `Generated ${alternatives.length} alternative paths with varying strategies`;
        const tokens = this.calculateTokenUsage(description + reasoning);
        const baseStep = await this.createStep(description, reasoning, tokens);
        // Create enhanced step with proper type
        const enhancedStep = {
            ...baseStep,
            confidence: 0.8,
            metrics: {
                complexityScore: 0.7,
                tokenEfficiency: 0.9
            }
        };
        return enhancedStep;
    }
    async evaluateApproachesStep() {
        const comparison = await this.compareAlternativePaths();
        const description = 'Evaluating and comparing solution approaches';
        const reasoning = `Analyzed trade-offs between ${this.alternativePaths.length + 1} different approaches`;
        const tokens = this.calculateTokenUsage(description + reasoning);
        const baseStep = await this.createStep(description, reasoning, tokens);
        // Create enhanced step with proper type
        const enhancedStep = {
            ...baseStep,
            confidence: 0.85,
            metrics: {
                complexityScore: 0.8,
                tokenEfficiency: 0.85,
                uncertaintyFactors: this.uncertaintyFactors
            }
        };
        return enhancedStep;
    }
    async planStep() {
        const description = 'Developing detailed solution strategy';
        const reasoning = 'Creating structured approach based on selected path';
        const tokens = this.calculateTokenUsage(description + reasoning);
        const baseStep = await this.createStep(description, reasoning, tokens);
        // Create enhanced step with proper type
        const enhancedStep = {
            ...baseStep,
            confidence: 0.9,
            metrics: {
                complexityScore: 0.75,
                tokenEfficiency: 0.95
            }
        };
        return enhancedStep;
    }
    async executeStep() {
        const description = 'Executing planned solution with monitoring';
        const reasoning = 'Implementing solution components with continuous validation';
        const tokens = this.calculateTokenUsage(description + reasoning);
        const baseStep = await this.createStep(description, reasoning, tokens);
        // Create enhanced step with proper type
        const enhancedStep = {
            ...baseStep,
            confidence: 0.95,
            metrics: {
                complexityScore: 0.7,
                tokenEfficiency: 0.9
            }
        };
        return enhancedStep;
    }
    async validateStep() {
        const description = 'Validating solution effectiveness';
        const reasoning = 'Comprehensive validation against requirements';
        const tokens = this.calculateTokenUsage(description + reasoning);
        const baseStep = await this.createStep(description, reasoning, tokens);
        // Create enhanced step with proper type
        const enhancedStep = {
            ...baseStep,
            confidence: 0.9,
            metrics: {
                complexityScore: 0.6,
                tokenEfficiency: 0.95
            }
        };
        return enhancedStep;
    }
    async reflectStep() {
        const metrics = await this.getMetrics();
        const description = 'Reflecting on solution and process';
        const reasoning = `Final analysis with confidence ${metrics.confidence.toFixed(2)} and ${this.alternativePaths.length} alternative paths considered`;
        const tokens = this.calculateTokenUsage(description + reasoning);
        const baseStep = await this.createStep(description, reasoning, tokens);
        // Create enhanced step with proper type
        const enhancedStep = {
            ...baseStep,
            confidence: metrics.confidence,
            metrics: {
                complexityScore: 0.5,
                tokenEfficiency: 1.0
            }
        };
        return enhancedStep;
    }
    generateVisualization(steps) {
        const enhancedSteps = steps;
        // Create nodes for main path with confidence scores
        const mainNodes = enhancedSteps.map((step, index) => ({
            id: step.id,
            label: `${step.description}\nConfidence: ${(step.confidence * 100).toFixed(0)}%`,
            status: step.status,
            details: step.reasoning,
            depth: index,
            confidence: step.confidence,
            metrics: step.metrics
        }));
        // Create nodes for alternative paths
        const alternativeNodes = this.alternativePaths.flatMap((path, pathIndex) => path.steps.map((step, stepIndex) => ({
            id: `alt_${pathIndex}_${step.id}`,
            label: `Alternative ${pathIndex + 1}: ${step.description}`,
            status: 'alternative',
            details: step.reasoning,
            depth: stepIndex,
            confidence: path.confidence
        })));
        // Create edges for main path
        const mainEdges = mainNodes.slice(1).map((node, index) => ({
            source: mainNodes[index].id,
            target: node.id,
            label: `Step ${index + 1} → ${index + 2}\nΔ Confidence: ${(((node.confidence || 0) - (mainNodes[index].confidence || 0)) * 100).toFixed(1)}%`
        }));
        // Create edges for alternative paths
        const alternativeEdges = this.alternativePaths.flatMap((path, pathIndex) => path.steps.slice(1).map((step, stepIndex) => ({
            source: `alt_${pathIndex}_${path.steps[stepIndex].id}`,
            target: `alt_${pathIndex}_${step.id}`,
            label: `Alternative ${pathIndex + 1}`
        })));
        // Create edges connecting alternative paths to main path
        const crossEdges = this.alternativePaths.map((path, pathIndex) => ({
            source: mainNodes[0].id,
            target: `alt_${pathIndex}_${path.steps[0].id}`,
            label: `Alternative Path ${pathIndex + 1}\nConfidence: ${(path.confidence * 100).toFixed(0)}%`
        }));
        return {
            type: 'network',
            nodes: [...mainNodes, ...alternativeNodes],
            edges: [...mainEdges, ...alternativeEdges, ...crossEdges],
            layout: {
                type: 'hierarchical',
                direction: 'TB',
                levelSeparation: 150,
                nodeSpacing: 200,
                treeSpacing: 200,
                springLength: 200,
                springConstant: 0.7,
                gravity: 0.5
            }
        };
    }
}
//# sourceMappingURL=EnhancedThinkingStrategy.js.map