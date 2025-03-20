/**
 * Minimal thinking model strategy
 * Provides a streamlined thinking approach with fewer steps
 */

import { BaseThinkingStrategy } from './BaseThinkingStrategy.js';
import { ThinkingStep, ThinkingVisualization } from '../models/types.js';

export class MinimalThinkingStrategy extends BaseThinkingStrategy {
  private currentStep = 0;
  private problem = '';

  /**
   * Initialize the strategy with a problem
   */
  async initialize(problem: string): Promise<void> {
    this.problem = problem;
    this.currentStep = 0;
    this.steps = [];

    // Minimal base token count
    const baseTokens = 100;

    this.addStep(await this.createStep(
      'Analyze problem requirements',
      'Quick assessment of core requirements to identify solution path',
      baseTokens
    ));

    this.addStep(await this.createStep(
      'Design minimal solution',
      'Focus on essential components for a streamlined solution',
      baseTokens * 1.2
    ));

    this.addStep(await this.createStep(
      'Implement core functionality',
      'Direct implementation of essential features',
      baseTokens * 1.3
    ));
  }

  /**
   * Execute the next thinking step
   */
  async executeNextStep(): Promise<ThinkingStep> {
    if (!this.shouldContinue()) {
      throw new Error('No more steps to execute');
    }

    const step = this.steps[this.currentStep];
    step.status = 'completed';
    this.currentStep++;

    if (this.currentStep < this.steps.length) {
      this.steps[this.currentStep].status = 'active';
    }

    return step;
  }

  /**
   * Determine if the strategy should continue executing steps
   */
  shouldContinue(): boolean {
    return this.currentStep < this.steps.length;
  }

  /**
   * Get the current progress (0-1)
   */
  getProgress(): number {
    return this.currentStep / this.steps.length;
  }

  /**
   * Gets the name of the thinking model
   */
  getName(): string {
    return 'minimal';
  }

  /**
   * Generates a visualization of the thinking process
   */
  generateVisualization(steps: ThinkingStep[]): ThinkingVisualization {
    return {
      type: 'linear',
      nodes: steps.map(step => ({
        id: step.id,
        label: step.description,
        status: step.status,
        details: step.reasoning
      })),
      edges: this.generateLinearEdges(steps),
      layout: {
        type: 'hierarchical',
        direction: 'LR',
        levelSeparation: 80,  // Smaller separation for minimal view
        nodeSpacing: 40      // Reduced spacing between nodes
      }
    };
  }

  /**
   * Generates edges for a linear visualization
   * @private
   */
  private generateLinearEdges(steps: ThinkingStep[]): Array<{
    source: string;
    target: string;
    label?: string;
  }> {
    const edges: Array<{
      source: string;
      target: string;
      label?: string;
    }> = [];

    // Simple linear connections between steps
    for (let i = 0; i < steps.length - 1; i++) {
      edges.push({
        source: steps[i].id,
        target: steps[i + 1].id,
        label: 'next'
      });
    }

    return edges;
  }
}