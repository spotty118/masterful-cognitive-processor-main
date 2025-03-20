/**
 * Expanded step-by-step thinking model strategy
 * Provides a comprehensive thinking approach with detailed steps
 */

import { BaseThinkingStrategy } from './BaseThinkingStrategy.js';
import { ThinkingStep, ThinkingVisualization } from '../models/types.js';

export class ExpandedStepByStepStrategy extends BaseThinkingStrategy {
  private currentStep = 0;
  private problem = '';

  /**
   * Initialize the strategy with a problem
   */
  async initialize(problem: string): Promise<void> {
    this.problem = problem;
    this.currentStep = 0;
    this.steps = [];

    // Higher base tokens for expanded analysis
    const baseTokens = 200;

    this.addStep(await this.createStep(
      'Problem Analysis and Requirements',
      'Deep understanding of the problem space and detailed requirements gathering',
      baseTokens
    ));

    this.addStep(await this.createStep(
      'Component Identification and Relationships',
      'Comprehensive breakdown of system components and their interconnections',
      baseTokens * 1.2
    ));

    this.addStep(await this.createStep(
      'Solution Approach Exploration',
      'Thorough exploration of multiple solution strategies and their implications',
      baseTokens * 1.3
    ));

    this.addStep(await this.createStep(
      'Detailed Architecture Design',
      'In-depth architecture design with consideration for all system aspects',
      baseTokens * 1.4
    ));

    this.addStep(await this.createStep(
      'Implementation Planning',
      'Detailed step-by-step implementation plan with clear milestones',
      baseTokens * 1.5
    ));

    this.addStep(await this.createStep(
      'Validation Strategy',
      'Comprehensive validation approach covering all requirements',
      baseTokens * 1.3
    ));

    this.addStep(await this.createStep(
      'Edge Case Analysis',
      'Thorough examination of edge cases and potential failure modes',
      baseTokens * 1.4
    ));

    this.addStep(await this.createStep(
      'Performance Optimization',
      'Detailed performance analysis and optimization strategies',
      baseTokens * 1.5
    ));

    this.addStep(await this.createStep(
      'Maintainability Review',
      'Assessment of code maintainability and documentation needs',
      baseTokens * 1.2
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
    return 'expanded_step_by_step';
  }

  /**
   * Generates a visualization of the thinking process
   */
  generateVisualization(steps: ThinkingStep[]): ThinkingVisualization {
    return {
      type: 'hierarchical',
      nodes: steps.map(step => ({
        id: step.id,
        label: step.description,
        status: step.status,
        details: step.reasoning,
        depth: this.calculateStepDepth(step)
      })),
      edges: this.generateExpandedEdges(steps),
      layout: {
        type: 'hierarchical',
        direction: 'TB',
        levelSeparation: 120,
        nodeSpacing: 100,
        treeSpacing: 200
      }
    };
  }

  /**
   * Calculate the depth level of a step
   * @private
   */
  private calculateStepDepth(step: ThinkingStep): number {
    const phases = {
      analysis: 1,
      design: 2,
      implementation: 3,
      validation: 4,
      optimization: 5
    };

    const description = step.description.toLowerCase();
    if (description.includes('analysis') || description.includes('requirements')) {
      return phases.analysis;
    } else if (description.includes('design') || description.includes('architecture')) {
      return phases.design;
    } else if (description.includes('implementation')) {
      return phases.implementation;
    } else if (description.includes('validation') || description.includes('edge case')) {
      return phases.validation;
    } else if (description.includes('optimization') || description.includes('maintainability')) {
      return phases.optimization;
    }
    return 1;
  }

  /**
   * Generates edges for the expanded visualization
   * @private
   */
  private generateExpandedEdges(steps: ThinkingStep[]): Array<{
    source: string;
    target: string;
    label?: string;
  }> {
    const edges: Array<{
      source: string;
      target: string;
      label?: string;
    }> = [];

    // Create primary flow connections
    for (let i = 0; i < steps.length - 1; i++) {
      edges.push({
        source: steps[i].id,
        target: steps[i + 1].id,
        label: 'next'
      });
    }

    // Add cross-phase connections
    const phases = this.groupStepsByPhase(steps);
    Object.values(phases).forEach(phaseSteps => {
      if (phaseSteps.length > 1) {
        for (let i = 0; i < phaseSteps.length - 1; i++) {
          edges.push({
            source: phaseSteps[i].id,
            target: phaseSteps[i + 1].id,
            label: 'related'
          });
        }
      }
    });

    return edges;
  }

  /**
   * Group steps by their phase for visualization
   * @private
   */
  private groupStepsByPhase(steps: ThinkingStep[]): Record<string, ThinkingStep[]> {
    const phases: Record<string, ThinkingStep[]> = {
      analysis: [],
      design: [],
      implementation: [],
      validation: [],
      optimization: []
    };

    steps.forEach(step => {
      const depth = this.calculateStepDepth(step);
      switch (depth) {
        case 1:
          phases.analysis.push(step);
          break;
        case 2:
          phases.design.push(step);
          break;
        case 3:
          phases.implementation.push(step);
          break;
        case 4:
          phases.validation.push(step);
          break;
        case 5:
          phases.optimization.push(step);
          break;
      }
    });

    return phases;
  }
}