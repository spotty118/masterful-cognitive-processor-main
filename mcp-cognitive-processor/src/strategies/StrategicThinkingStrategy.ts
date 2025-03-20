/**
 * Strategic thinking strategy implementation
 * Implements a step-by-step approach to problem solving with strategic planning
 */

import { ThinkingStep, ThinkingModel, ThinkingVisualization } from '../models/types.js';
import { ITokenOptimizer } from '../interfaces/ITokenOptimizer.js';
import { BaseThinkingStrategy } from './BaseThinkingStrategy.js';

export class StrategicThinkingStrategy extends BaseThinkingStrategy {
  private problem: string = '';
  private currentPhase: number = 0;
  private phases = ['analyze', 'decompose', 'plan', 'execute', 'validate'];
  private completed: boolean = false;

  constructor(model: ThinkingModel, tokenOptimizer: ITokenOptimizer) {
    super(model, tokenOptimizer);
  }

  async initialize(problem: string): Promise<void> {
    this.problem = await this.optimizeContent(problem);
    this.currentPhase = 0;
    this.completed = false;
    this.steps = [];
  }

  async executeNextStep(): Promise<ThinkingStep> {
    const phase = this.phases[this.currentPhase];
    let step: ThinkingStep;

    switch (phase) {
      case 'analyze':
        step = await this.analyzeStep();
        break;
      case 'decompose':
        step = await this.decomposeStep();
        break;
      case 'plan':
        step = await this.planStep();
        break;
      case 'execute':
        step = await this.executeStep();
        break;
      case 'validate':
        step = await this.validateStep();
        this.completed = true;
        break;
      default:
        throw new Error('Invalid phase');
    }

    this.addStep(step);
    if (this.currentPhase < this.phases.length - 1) {
      this.currentPhase++;
    }

    return step;
  }

  shouldContinue(): boolean {
    return !this.completed;
  }

  getProgress(): number {
    return (this.currentPhase + 1) / this.phases.length;
  }

  generateVisualization(steps: ThinkingStep[]): ThinkingVisualization {
    // Create a visualization that includes confidence scores and metrics
    const nodes = steps.map((step, index) => {
      const enhancedStep = step as ThinkingStep & { confidence: number };
      return {
        id: step.id,
        label: `${step.description}\nConfidence: ${(enhancedStep.confidence * 100).toFixed(0)}%`,
        status: step.status,
        details: `${step.reasoning}\n\nMetrics:\n${
          step.metrics ? Object.entries(step.metrics)
            .map(([key, value]) => `${key}: ${typeof value === 'number' ? value.toFixed(2) : value}`)
            .join('\n') : 'No metrics available'
        }`,
        depth: index
      };
    });

    const edges = nodes.slice(1).map((node, index) => {
      const currentStep = steps[index + 1] as ThinkingStep & { confidence: number };
      const previousStep = steps[index] as ThinkingStep & { confidence: number };
      const confidenceDelta = currentStep.confidence - previousStep.confidence;

      return {
        source: nodes[index].id,
        target: node.id,
        label: `Step ${index + 1} → ${index + 2}\nΔ Confidence: ${(confidenceDelta * 100).toFixed(1)}%`
      };
    });

    return {
      type: 'linear',
      nodes,
      edges,
      layout: {
        type: 'hierarchical',
        direction: 'LR',
        levelSeparation: 150,
        nodeSpacing: 150,
        treeSpacing: 200
      }
    };
  }

  private async analyzeStep(): Promise<ThinkingStep> {
    const description = 'Analyzing problem complexity and scope';
    const reasoning = `Evaluating "${this.problem}" for key components and challenges`;
    const tokens = this.calculateTokenUsage(this.problem);
    
    return await this.createStep(description, reasoning, tokens);
  }

  private async decomposeStep(): Promise<ThinkingStep> {
    const description = 'Decomposing problem into manageable components';
    const reasoning = 'Breaking down complex problem into smaller, actionable tasks';
    const tokens = this.calculateTokenUsage(description + reasoning);
    
    return await this.createStep(description, reasoning, tokens);
  }

  private async planStep(): Promise<ThinkingStep> {
    const description = 'Developing solution strategy';
    const reasoning = 'Creating structured approach based on problem decomposition';
    const tokens = this.calculateTokenUsage(description + reasoning);
    
    return await this.createStep(description, reasoning, tokens);
  }

  private async executeStep(): Promise<ThinkingStep> {
    const description = 'Executing planned solution';
    const reasoning = 'Implementing solution components according to strategy';
    const tokens = this.calculateTokenUsage(description + reasoning);
    
    return await this.createStep(description, reasoning, tokens);
  }

  private async validateStep(): Promise<ThinkingStep> {
    const description = 'Validating solution effectiveness';
    const reasoning = 'Verifying solution meets requirements and constraints';
    const tokens = this.calculateTokenUsage(description + reasoning);
    
    return await this.createStep(description, reasoning, tokens);
  }
}