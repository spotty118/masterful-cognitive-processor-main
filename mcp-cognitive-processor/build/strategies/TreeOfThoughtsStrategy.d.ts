/**
 * Tree of Thoughts thinking strategy implementation
 * Implements a branching thought process that explores multiple reasoning paths, evaluates them, and potentially backtracks
 */
import { ThinkingStep, ThinkingModel, ThinkingVisualization } from '../models/types.js';
import { ITokenOptimizer } from '../interfaces/ITokenOptimizer.js';
import { BaseThinkingStrategy } from './BaseThinkingStrategy.js';
export declare class TreeOfThoughtsStrategy extends BaseThinkingStrategy {
    private problem;
    private currentDepth;
    private maxDepth;
    private branchingFactor;
    private completed;
    private currentBranchId;
    private thoughtBranches;
    private activePath;
    constructor(model: ThinkingModel, tokenOptimizer: ITokenOptimizer);
    initialize(problem: string): Promise<void>;
    executeNextStep(): Promise<ThinkingStep>;
    shouldContinue(): boolean;
    getProgress(): number;
    generateVisualization(steps: ThinkingStep[]): ThinkingVisualization;
    private generateInitialThoughts;
    private expandBestBranch;
    private synthesizeThoughts;
    private finalizeThoughts;
    private findBestUnexploredBranch;
    private getBranchDepth;
    private countExploredBranches;
    private countBranchesAtDepth;
    private countExploredAtDepth;
    private getPathToRoot;
    private getActivePathDescription;
    private reevaluateBranches;
    private findBestCompletePath;
}
