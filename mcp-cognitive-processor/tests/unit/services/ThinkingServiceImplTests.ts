/**
 * Unit tests for ThinkingServiceImpl
 */

import * as assert from 'assert';
import { ThinkingServiceImpl } from '../../../src/services/ThinkingServiceImpl';
import * as sinon from 'sinon';
import { thinkingModelFactory } from '../../../src/factories/ThinkingModelFactory';
import * as memoryService from '../../../src/services/memoryService';
import * as cacheService from '../../../src/services/cacheService';
import * as tokenOptimizer from '../../../src/utils/tokenOptimizer';
import * as fs from 'fs';

// Create stubs for dependencies
describe('ThinkingServiceImpl', () => {
  let thinkingService: ThinkingServiceImpl;
  let sandbox: sinon.SinonSandbox;
  
  beforeEach(() => {
    // Create a sandbox for managing stubs
    sandbox = sinon.createSandbox();
    
    // Stub thinkingModelFactory
    sandbox.stub(thinkingModelFactory, 'getModel').callsFake((modelName) => {
      if (modelName === 'unknown_model') {
        throw new Error('Unknown thinking model: unknown_model');
      }
      return {
        name: modelName,
        description: 'Test model',
        tokenLimit: 'moderate' as any,
        complexity: 'medium' as any
      };
    });
    
    // Stub memoryService
    sandbox.stub(memoryService, 'storeMemory').resolves(undefined);
    sandbox.stub(memoryService, 'retrieveMemory').resolves([]);
    
    // Stub cacheService
    sandbox.stub(cacheService, 'checkCache').resolves(null);
    sandbox.stub(cacheService, 'storeCache').resolves(undefined);
    
    // Stub tokenOptimizer
    sandbox.stub(tokenOptimizer, 'optimizeTokenUsage').returns({
      selected_model: 'standard',
      estimated_tokens: 1000,
      optimized_tokens: 800,
      token_savings: 200,
      optimization_strategy: 'full_thinking'
    });
    sandbox.stub(tokenOptimizer, 'performOptimizationMaintenance').resolves(0);
    
    // Stub fs
    sandbox.stub(fs, 'existsSync').returns(true);
    sandbox.stub(fs, 'mkdirSync');
    sandbox.stub(fs, 'writeFileSync');
    sandbox.stub(fs, 'readFileSync').returns('[]');
    sandbox.stub(fs, 'readdirSync').returns([]);
    sandbox.stub(fs, 'statSync').returns({ mtimeMs: Date.now() } as any);
    sandbox.stub(fs, 'unlinkSync');
    
    // Create a new instance for each test
    thinkingService = new ThinkingServiceImpl();
  });
  
  afterEach(() => {
    // Restore all stubs
    sandbox.restore();
  });
  
  describe('decomposePrompt', () => {
    it('should throw error for unknown thinking model', async () => {
      // Arrange
      const problem = 'Test problem';
      const thinkingModel = 'unknown_model';
      
      // Act & Assert
      try {
        await thinkingService.decomposePrompt(problem, thinkingModel);
        assert.fail('Expected error was not thrown');
      } catch (error: any) {
        assert.strictEqual(error.message, 'Unknown thinking model: unknown_model');
      }
      
      sinon.assert.calledWith(thinkingModelFactory.getModel as sinon.SinonStub, thinkingModel);
    });
    
    it('should return steps for valid thinking model', async () => {
      // Arrange
      const problem = 'Test problem';
      const thinkingModel = 'standard';
      
      // Act
      const result = await thinkingService.decomposePrompt(problem, thinkingModel);
      
      // Assert
      assert.ok(result);
      assert.ok(Array.isArray(result));
      assert.ok(result.length > 0);
      sinon.assert.calledWith(thinkingModelFactory.getModel as sinon.SinonStub, thinkingModel);
    });
    
    it('should add domain-specific steps for algorithm problems', async () => {
      // Arrange
      const problem = 'Design an efficient algorithm for sorting';
      const thinkingModel = 'standard';
      
      // Act
      const result = await thinkingService.decomposePrompt(problem, thinkingModel);
      
      // Assert
      assert.ok(result);
      const algorithmStep = result.find(step =>
        step.description.includes('algorithm complexity')
      );
      assert.ok(algorithmStep);
    });
  });
  
  describe('executeThinkingStep', () => {
    it('should execute a thinking step and return updated state', async () => {
      // Arrange
      const stepId = '1';
      const description = 'Analyze problem requirements';
      const reasoning = 'Understanding requirements is important';
      const currentState = {
        problem: 'Test problem',
        response: undefined
      };
      
      // Set up memory retrieval stub
      (memoryService.retrieveMemory as sinon.SinonStub).resolves([]);
      
      // Act
      const result = await thinkingService.executeThinkingStep(
        stepId,
        description,
        reasoning,
        currentState
      );
      
      // Assert
      assert.ok(result);
      assert.strictEqual(result.problem, currentState.problem);
      assert.ok(result.response.includes(`Step ${stepId}: ${description}`));
      assert.ok(result.response.includes(`Reasoning: ${reasoning}`));
      sinon.assert.called(memoryService.storeMemory as sinon.SinonStub);
    });
    
    it('should incorporate relevant memory when available', async () => {
      // Arrange
      const stepId = '1';
      const description = 'Analyze problem requirements';
      const reasoning = 'Understanding requirements is important';
      const currentState = {
        problem: 'Test problem',
        response: undefined
      };
      
      // Set up memory retrieval stub with relevant results
      const memoryResults = [
        { id: 'mem1', content: 'Previous insight', relevance: 0.8 }
      ];
      (memoryService.retrieveMemory as sinon.SinonStub).resolves(memoryResults);
      
      // Act
      const result = await thinkingService.executeThinkingStep(
        stepId,
        description,
        reasoning,
        currentState
      );
      
      // Assert
      assert.ok(result);
      assert.ok(result.response.includes('Previous insight'));
      sinon.assert.called(memoryService.retrieveMemory as sinon.SinonStub);
    });
  });
  
  describe('initiateThinkingProcess', () => {
    it('should initiate thinking process and return response', async () => {
      // Arrange
      const request = {
        problem: 'Test problem',
        thinking_model: 'standard'
      };
      
      // Act
      const result = await thinkingService.initiateThinkingProcess(request);
      
      // Assert
      assert.ok(result);
      assert.ok(result.documentation);
      assert.ok(result.documentation.steps);
      assert.ok(Array.isArray(result.documentation.steps));
      sinon.assert.called(memoryService.storeMemory as sinon.SinonStub);
    });
    
    it('should apply token optimization when requested', async () => {
      // Arrange
      const request = {
        problem: 'Test problem',
        thinking_model: 'standard',
        optimize_tokens: true
      };
      
      // Act
      const result = await thinkingService.initiateThinkingProcess(request);
      
      // Assert
      assert.ok(result);
      assert.ok(result.optimization);
      sinon.assert.called(tokenOptimizer.optimizeTokenUsage as sinon.SinonStub);
    });
    
    it('should throw error for missing problem', async () => {
      // Arrange
      const request = {
        problem: '',
        thinking_model: 'standard'
      };
      
      // Act & Assert
      try {
        await thinkingService.initiateThinkingProcess(request);
        assert.fail('Expected error was not thrown');
      } catch (error: any) {
        assert.strictEqual(error.message, 'Problem statement is required');
      }
    });
    
    it('should throw error for missing thinking model', async () => {
      // Arrange
      const request = {
        problem: 'Test problem',
        thinking_model: ''
      };
      
      // Act & Assert
      try {
        await thinkingService.initiateThinkingProcess(request);
        assert.fail('Expected error was not thrown');
      } catch (error: any) {
        assert.strictEqual(error.message, 'Thinking model is required');
      }
    });
  });
  
  describe('performThinkingMaintenance', () => {
    it('should perform maintenance and return count of processed items', async () => {
      // Act
      const result = await thinkingService.performThinkingMaintenance();
      
      // Assert
      assert.strictEqual(typeof result, 'number');
    });
  });
});