/**
 * Tree of Thoughts thinking strategy implementation
 * Implements a branching thought process that explores multiple reasoning paths, evaluates them, and potentially backtracks
 */

import { ThinkingStep, ThinkingModel, ThinkingVisualization } from '../models/types.js';
import { ITokenOptimizer } from '../interfaces/ITokenOptimizer.js';
import { BaseThinkingStrategy } from './BaseThinkingStrategy.js';

interface ThoughtBranch {
  id: string;
  parentId: string | null;
  description: string;
  reasoning: string;
  evaluation: number; // 0-1 rating of branch quality
  explored: boolean;
  children: string[]; // IDs of child thoughts
}

export class TreeOfThoughtsStrategy extends BaseThinkingStrategy {
  private problem: string = '';
  private currentDepth: number = 0;
  private maxDepth: number = 4;
  private branchingFactor: number = 3;
  private completed: boolean = false;
  private currentBranchId: string | null = null;
  private thoughtBranches: Map<string, ThoughtBranch> = new Map();
  private activePath: string[] = []; // Keeps track of the currently active exploration path

  constructor(model: ThinkingModel, tokenOptimizer: ITokenOptimizer) {
    super(model, tokenOptimizer);
  }

  async initialize(problem: string): Promise<void> {
    this.problem = await this.optimizeContent(problem);
    this.currentDepth = 0;
    this.completed = false;
    this.steps = [];
    this.thoughtBranches = new Map();
    this.currentBranchId = null;
    this.activePath = [];
    
    // Adjust strategy parameters based on problem complexity
    const problemTokens = this.calculateTokenUsage(problem);
    if (problemTokens < 150) {
      this.maxDepth = 3;
      this.branchingFactor = 2;
    } else if (problemTokens < 400) {
      this.maxDepth = 4;
      this.branchingFactor = 3;
    } else {
      this.maxDepth = 5;
      this.branchingFactor = 3;
    }
  }

  async executeNextStep(): Promise<ThinkingStep> {
    let step: ThinkingStep;

    if (this.currentDepth === 0) {
      // Initial step: create root thoughts
      step = await this.generateInitialThoughts();
      this.currentDepth++;
    } else if (this.currentDepth < this.maxDepth) {
      // Explore and expand the most promising branch
      step = await this.expandBestBranch();
      
      // Move to next depth if we've explored enough at current depth
      const exploredAtCurrentDepth = this.countExploredAtDepth(this.currentDepth);
      const totalAtCurrentDepth = this.countBranchesAtDepth(this.currentDepth);
      
      if (exploredAtCurrentDepth >= Math.min(totalAtCurrentDepth, this.branchingFactor)) {
        this.currentDepth++;
      }
    } else {
      // Final evaluation and conclusion
      step = await this.finalizeThoughts();
      this.completed = true;
    }

    this.addStep(step);
    return step;
  }

  shouldContinue(): boolean {
    return !this.completed;
  }

  getProgress(): number {
    // Calculate progress based on depth reached and branches explored
    const depthProgress = this.currentDepth / this.maxDepth;
    const explorationProgress = this.countExploredBranches() / 
                               (this.thoughtBranches.size || 1);
    
    return (depthProgress * 0.6) + (explorationProgress * 0.4);
  }

  generateVisualization(steps: ThinkingStep[]): ThinkingVisualization {
    // Create a tree visualization of the thinking process
    const nodes = Array.from(this.thoughtBranches.values()).map(branch => ({
      id: branch.id,
      label: branch.description,
      status: branch.explored ? 'completed' : 'pending',
      details: branch.reasoning,
      depth: this.getBranchDepth(branch.id),
      evaluation: branch.evaluation
    }));

    // Create edges between parent and child nodes
    const edges: Array<{source: string, target: string, label?: string}> = [];
    this.thoughtBranches.forEach(branch => {
      if (branch.parentId) {
        edges.push({
          source: branch.parentId,
          target: branch.id,
          label: `Evaluation: ${branch.evaluation.toFixed(2)}`
        });
      }
      
      branch.children.forEach(childId => {
        if (!edges.some(e => e.source === branch.id && e.target === childId)) {
          edges.push({
            source: branch.id,
            target: childId
          });
        }
      });
    });

    return {
      type: 'tree',
      nodes,
      edges,
      layout: {
        type: 'hierarchical',
        direction: 'TB',
        levelSeparation: 150,
        nodeSpacing: 100
      }
    };
  }

  private async generateInitialThoughts(): Promise<ThinkingStep> {
    const description = "Generating initial thought branches";
    const reasoning = `Exploring multiple initial approaches to the problem: "${this.problem}"`;
    
    // Create root thought branches
    for (let i = 0; i < this.branchingFactor; i++) {
      const branchId = `branch_${i}_0`; // Level 0, branch i
      const branchDesc = `Initial approach ${i+1}`;
      const branchReasoning = `Exploring initial direction ${i+1} for the problem.`;
      
      this.thoughtBranches.set(branchId, {
        id: branchId,
        parentId: null,
        description: branchDesc,
        reasoning: branchReasoning,
        evaluation: 0.5, // Initial neutral evaluation
        explored: false,
        children: []
      });
    }
    
    const tokens = this.calculateTokenUsage(description + reasoning);
    return this.createStep(description, reasoning, tokens);
  }

  private async expandBestBranch(): Promise<ThinkingStep> {
    // Find the most promising unexplored branch at the current depth
    const targetBranch = this.findBestUnexploredBranch(this.currentDepth);
    
    if (!targetBranch) {
      // Backtrack to previous depth if no unexplored branches at current depth
      this.currentDepth = Math.max(1, this.currentDepth - 1);
      const backtrackBranch = this.findBestUnexploredBranch(this.currentDepth);
      
      if (!backtrackBranch) {
        // If still no branches to explore, create a synthesis step
        return await this.synthesizeThoughts();
      }
      
      const description = `Backtracking to depth ${this.currentDepth}`;
      const reasoning = `Previous paths were exhausted or unproductive. Backtracking to explore alternative branch: ${backtrackBranch.description}`;
      this.currentBranchId = backtrackBranch.id;
      backtrackBranch.explored = true;
      
      // Update active path
      this.activePath = this.getPathToRoot(backtrackBranch.id);
      
      const tokens = this.calculateTokenUsage(description + reasoning);
      return this.createStep(description, reasoning, tokens);
    }
    
    // Mark the target branch as explored
    targetBranch.explored = true;
    this.currentBranchId = targetBranch.id;
    
    // Update active path
    this.activePath = this.getPathToRoot(targetBranch.id);
    
    // Generate child branches if this isn't a leaf node
    if (this.currentDepth < this.maxDepth - 1) {
      for (let i = 0; i < this.branchingFactor; i++) {
        const childId = `${targetBranch.id}_${i+1}`;
        const childDesc = `Thought branch from ${targetBranch.description} (option ${i+1})`;
        const childReasoning = `Extending reasoning path from parent branch ${targetBranch.id}`;
        
        this.thoughtBranches.set(childId, {
          id: childId,
          parentId: targetBranch.id,
          description: childDesc,
          reasoning: childReasoning,
          evaluation: 0.5, // Initial neutral evaluation
          explored: false,
          children: []
        });
        
        targetBranch.children.push(childId);
      }
    }
    
    const description = `Exploring branch at depth ${this.currentDepth}: ${targetBranch.description}`;
    const reasoning = `Developing reasoning for branch: ${targetBranch.reasoning}\nThis branch builds on previous thoughts: ${this.getActivePathDescription()}`;
    
    const tokens = this.calculateTokenUsage(description + reasoning);
    return this.createStep(description, reasoning, tokens);
  }

  private async synthesizeThoughts(): Promise<ThinkingStep> {
    const description = "Synthesizing insights from multiple thought branches";
    const reasoning = "Comparing and contrasting different reasoning paths to extract the most valuable insights";
    
    // Re-evaluate branches based on their reasoning quality
    this.reevaluateBranches();
    
    const tokens = this.calculateTokenUsage(description + reasoning);
    return this.createStep(description, reasoning, tokens);
  }

  private async finalizeThoughts(): Promise<ThinkingStep> {
    // Find the best complete path through the tree
    const bestPath = this.findBestCompletePath();
    const pathDescription = bestPath.map(branchId => {
      const branch = this.thoughtBranches.get(branchId);
      return branch ? branch.description : "unknown";
    }).join(" → ");
    
    const description = "Finalizing solution based on optimal reasoning path";
    const reasoning = `After exploring multiple reasoning paths and evaluating their quality, the optimal path was identified as: ${pathDescription}`;
    
    const tokens = this.calculateTokenUsage(description + reasoning);
    return this.createStep(description, reasoning, tokens);
  }

  private findBestUnexploredBranch(depth: number): ThoughtBranch | null {
    let bestBranch: ThoughtBranch | null = null;
    let bestEvaluation = -1;
    
    this.thoughtBranches.forEach(branch => {
      if (!branch.explored && this.getBranchDepth(branch.id) === depth && branch.evaluation > bestEvaluation) {
        bestBranch = branch;
        bestEvaluation = branch.evaluation;
      }
    });
    
    return bestBranch;
  }

  private getBranchDepth(branchId: string): number {
    // Count number of underscores to determine depth (branch_0_1_2 would be depth 3)
    return (branchId.match(/_/g) || []).length;
  }

  private countExploredBranches(): number {
    let count = 0;
    this.thoughtBranches.forEach(branch => {
      if (branch.explored) count++;
    });
    return count;
  }

  private countBranchesAtDepth(depth: number): number {
    let count = 0;
    this.thoughtBranches.forEach(branch => {
      if (this.getBranchDepth(branch.id) === depth) count++;
    });
    return count;
  }

  private countExploredAtDepth(depth: number): number {
    let count = 0;
    this.thoughtBranches.forEach(branch => {
      if (branch.explored && this.getBranchDepth(branch.id) === depth) count++;
    });
    return count;
  }

  private getPathToRoot(branchId: string): string[] {
    const path: string[] = [];
    let currentId: string | null = branchId;
    
    while (currentId) {
      path.unshift(currentId);
      const branch = this.thoughtBranches.get(currentId);
      currentId = branch ? branch.parentId : null;
    }
    
    return path;
  }

  private getActivePathDescription(): string {
    return this.activePath.map(id => {
      const branch = this.thoughtBranches.get(id);
      return branch ? branch.description : "unknown";
    }).join(" → ");
  }

  private reevaluateBranches(): void {
    // In a real implementation, this would use more sophisticated evaluation criteria
    // For now, we'll adjust evaluations slightly to simulate evaluation
    this.thoughtBranches.forEach(branch => {
      if (branch.explored) {
        // Slightly adjust evaluation based on branch depth (favoring deeper branches)
        const depthFactor = this.getBranchDepth(branch.id) / this.maxDepth;
        branch.evaluation = Math.min(0.9, branch.evaluation + (depthFactor * 0.1));
      }
    });
  }

  private findBestCompletePath(): string[] {
    // Find paths that reach the maximum depth
    const completePaths: string[][] = [];
    const leafBranches = Array.from(this.thoughtBranches.values())
      .filter(branch => this.getBranchDepth(branch.id) === this.maxDepth - 1);
    
    leafBranches.forEach(leaf => {
      completePaths.push(this.getPathToRoot(leaf.id));
    });
    
    // If no complete paths, take the longest available path
    if (completePaths.length === 0) {
      let longestPath: string[] = [];
      this.thoughtBranches.forEach(branch => {
        const path = this.getPathToRoot(branch.id);
        if (path.length > longestPath.length) {
          longestPath = path;
        }
      });
      return longestPath;
    }
    
    // Evaluate each complete path and find the best one
    let bestPath: string[] = [];
    let bestScore = -1;
    
    completePaths.forEach(path => {
      let pathScore = 0;
      path.forEach(branchId => {
        const branch = this.thoughtBranches.get(branchId);
        if (branch) {
          pathScore += branch.evaluation;
        }
      });
      pathScore /= path.length; // Average evaluation
      
      if (pathScore > bestScore) {
        bestScore = pathScore;
        bestPath = path;
      }
    });
    
    return bestPath;
  }
}