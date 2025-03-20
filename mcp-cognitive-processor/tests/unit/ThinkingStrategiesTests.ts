/**
 * Unit tests for thinking strategies
 * Tests the functionality of various thinking model strategies
 */

import { expect } from 'chai';
import { describe, it } from 'mocha';

import { ThinkingModelStrategyFactory } from '../../src/factories/ThinkingModelStrategyFactory.js';
import { IThinkingModelStrategy } from '../../src/interfaces/IThinkingModelStrategy.js';
import { ThinkingStep } from '../../src/models/types.js';

describe('ThinkingModelStrategies', () => {
  // Test the factory can create all strategies
  describe('ThinkingModelStrategyFactory', () => {
    it('should create all registered strategies', () => {
      const availableModels = ThinkingModelStrategyFactory.getAvailableModels();
      expect(availableModels).to.include('minimal');
      expect(availableModels).to.include('standard');
      expect(availableModels).to.include('expanded_step_by_step');
      expect(availableModels).to.include('breadth_first');
      expect(availableModels).to.include('depth_first');
      expect(availableModels).to.include('strategic');
    });

    it('should throw error for unknown strategy', () => {
      expect(() => ThinkingModelStrategyFactory.createStrategy('unknown_strategy')).to.throw();
    });
  });

  // Test each strategy individually
  describe('MinimalThinkingStrategy', () => {
    let strategy: IThinkingModelStrategy;
    
    beforeEach(() => {
      strategy = ThinkingModelStrategyFactory.createStrategy('minimal');
    });
    
    it('should return correct name', () => {
      expect(strategy.getName()).to.equal('minimal');
    });
    
    it('should generate fewer steps than standard', () => {
      const problem = 'Solve this simple problem';
      const steps = strategy.generateSteps(problem);
      expect(steps.length).to.be.lessThan(6);
    });
    
    it('should estimate fewer tokens than standard', () => {
      const minimalTokens = strategy.estimateTokens(0.5);
      const standardStrategy = ThinkingModelStrategyFactory.createStrategy('standard');
      const standardTokens = standardStrategy.estimateTokens(0.5);
      expect(minimalTokens).to.be.lessThan(standardTokens);
    });
  });
  
  describe('StandardThinkingStrategy', () => {
    let strategy: IThinkingModelStrategy;
    
    beforeEach(() => {
      strategy = ThinkingModelStrategyFactory.createStrategy('standard');
    });
    
    it('should return correct name', () => {
      expect(strategy.getName()).to.equal('standard');
    });
    
    it('should generate a moderate number of steps', () => {
      const problem = 'Design a simple web application';
      const steps = strategy.generateSteps(problem);
      expect(steps.length).to.be.at.least(5);
    });
    
    it('should add problem-specific steps for web problems', () => {
      const problem = 'Design a user interface for a web application';
      const steps = strategy.generateSteps(problem);
      const hasUIStep = steps.some(step => 
        step.description.toLowerCase().includes('user interface') || 
        step.description.toLowerCase().includes('interaction')
      );
      // Fix ESLint error by using a void expression
      void expect(hasUIStep).to.be.true;
    });
  });
  
  describe('ExpandedStepByStepStrategy', () => {
    let strategy: IThinkingModelStrategy;
    
    beforeEach(() => {
      strategy = ThinkingModelStrategyFactory.createStrategy('expanded_step_by_step');
    });
    
    it('should return correct name', () => {
      expect(strategy.getName()).to.equal('expanded_step_by_step');
    });
    
    it('should generate more steps than standard', () => {
      const problem = 'Design a complex system';
      const steps = strategy.generateSteps(problem);
      const standardStrategy = ThinkingModelStrategyFactory.createStrategy('standard');
      const standardSteps = standardStrategy.generateSteps(problem);
      expect(steps.length).to.be.greaterThan(standardSteps.length);
    });
    
    it('should estimate more tokens than any other strategy', () => {
      const expandedTokens = strategy.estimateTokens(0.5);
      const otherStrategies = ['minimal', 'standard', 'breadth_first', 'depth_first', 'strategic'];
      
      for (const strategyName of otherStrategies) {
        const otherStrategy = ThinkingModelStrategyFactory.createStrategy(strategyName);
        const otherTokens = otherStrategy.estimateTokens(0.5);
        expect(expandedTokens).to.be.greaterThan(otherTokens);
      }
    });
  });
  
  describe('BreadthFirstStrategy', () => {
    let strategy: IThinkingModelStrategy;
    
    beforeEach(() => {
      strategy = ThinkingModelStrategyFactory.createStrategy('breadth_first');
    });
    
    it('should return correct name', () => {
      expect(strategy.getName()).to.equal('breadth_first');
    });
    
    it('should include steps for multiple solution evaluation', () => {
      const problem = 'Evaluate different database options';
      const steps = strategy.generateSteps(problem);
      const hasMultipleSolutionsStep = steps.some(step => 
        step.description.toLowerCase().includes('multiple') || 
        step.description.toLowerCase().includes('candidates') ||
        step.description.toLowerCase().includes('evaluate')
      );
      // Fix ESLint error by using a void expression
      void expect(hasMultipleSolutionsStep).to.be.true;
    });
    
    it('should generate a network visualization', () => {
      const problem = 'Compare different approaches';
      const steps = strategy.generateSteps(problem);
      const visualization = strategy.generateVisualization(steps);
      expect(visualization).to.have.property('type', 'network');
    });
  });
  
  describe('DepthFirstStrategy', () => {
    let strategy: IThinkingModelStrategy;
    
    beforeEach(() => {
      strategy = ThinkingModelStrategyFactory.createStrategy('depth_first');
    });
    
    it('should return correct name', () => {
      expect(strategy.getName()).to.equal('depth_first');
    });
    
    it('should include steps for critical component analysis', () => {
      const problem = 'Optimize a performance-critical algorithm';
      const steps = strategy.generateSteps(problem);
      const hasCriticalAnalysisStep = steps.some(step => 
        step.description.toLowerCase().includes('critical') || 
        step.description.toLowerCase().includes('deep analysis')
      );
      // Fix ESLint error by using a void expression
      void expect(hasCriticalAnalysisStep).to.be.true;
    });
    
    it('should add algorithm-specific steps for performance problems', () => {
      const problem = 'Improve the performance of this algorithm';
      const steps = strategy.generateSteps(problem);
      const hasAlgorithmStep = steps.some(step => 
        step.description.toLowerCase().includes('algorithm') || 
        step.description.toLowerCase().includes('performance')
      );
      // Fix ESLint error by using a void expression
      void expect(hasAlgorithmStep).to.be.true;
    });
  });
  
  describe('StrategicThinkingStrategy', () => {
    let strategy: IThinkingModelStrategy;
    
    beforeEach(() => {
      strategy = ThinkingModelStrategyFactory.createStrategy('strategic');
    });
    
    it('should return correct name', () => {
      expect(strategy.getName()).to.equal('strategic');
    });
    
    it('should include steps for strategic planning', () => {
      const problem = 'Plan a system architecture';
      const steps = strategy.generateSteps(problem);
      const hasStrategicStep = steps.some(step => 
        step.description.toLowerCase().includes('strategic') || 
        step.description.toLowerCase().includes('objective') ||
        step.description.toLowerCase().includes('high-level')
      );
      // Fix ESLint error by using a void expression
      void expect(hasStrategicStep).to.be.true;
    });
    
    it('should generate a hierarchical visualization', () => {
      const problem = 'Design a system architecture';
      const steps = strategy.generateSteps(problem);
      const visualization = strategy.generateVisualization(steps);
      expect(visualization).to.have.property('type', 'hierarchical');
    });
  });
});