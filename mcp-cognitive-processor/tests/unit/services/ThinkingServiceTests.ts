/**
 * Simple tests for ThinkingServiceImpl
 * This file uses a basic testing approach without external dependencies
 */

import { ThinkingServiceImpl } from '../../../src/services/ThinkingServiceImpl';
import { thinkingModelFactory } from '../../../src/factories/ThinkingModelFactory';
import * as memoryService from '../../../src/services/memoryService';
import * as cacheService from '../../../src/services/cacheService';
import * as tokenOptimizer from '../../../src/utils/tokenOptimizer';
import * as fs from 'fs';
import { ThinkingModel } from '../../../src/models/types';

// Create a simple test runner
class TestRunner {
  private tests: { name: string; fn: () => Promise<void> }[] = [];
  private beforeEachFns: (() => void)[] = [];
  private afterEachFns: (() => void)[] = [];
  
  describe(name: string, fn: () => void): void {
    console.log(`\n== ${name} ==`);
    fn();
  }
  
  it(name: string, fn: () => Promise<void>): void {
    this.tests.push({ name, fn });
  }
  
  beforeEach(fn: () => void): void {
    this.beforeEachFns.push(fn);
  }
  
  afterEach(fn: () => void): void {
    this.afterEachFns.push(fn);
  }
  
  async run(): Promise<void> {
    let passed = 0;
    let failed = 0;
    
    for (const test of this.tests) {
      try {
        // Run beforeEach hooks
        for (const beforeFn of this.beforeEachFns) {
          beforeFn();
        }
        
        // Run the test
        console.log(`Running: ${test.name}`);
        await test.fn();
        
        // Run afterEach hooks
        for (const afterFn of this.afterEachFns) {
          afterFn();
        }
        
        console.log(`✓ PASS: ${test.name}`);
        passed++;
      } catch (error) {
        console.error(`✗ FAIL: ${test.name}`);
        console.error(error);
        failed++;
      }
    }
    
    console.log(`\nResults: ${passed} passed, ${failed} failed`);
  }
}

// Create a simple assertion library
class Assert {
  static ok(value: unknown, message?: string): void {
    if (!value) {
      throw new Error(message || `Expected value to be truthy, but got: ${String(value)}`);
    }
  }
  
  static strictEqual<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, but got: ${actual}`);
    }
  }
  
  static deepEqual<T>(actual: T, expected: T, message?: string): void {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    
    if (actualStr !== expectedStr) {
      throw new Error(message || `Expected ${expectedStr}, but got: ${actualStr}`);
    }
  }
  
  static async throws(fn: () => Promise<unknown>, expectedError?: string): Promise<void> {
    try {
      await fn();
      throw new Error('Expected function to throw, but it did not');
    } catch (error: unknown) {
      if (expectedError && error instanceof Error && error.message !== expectedError) {
        throw new Error(`Expected error message "${expectedError}", but got: "${error.message}"`);
      }
    }
  }
}

// Create stubs for dependencies
/* eslint-disable */
function createStub<T extends object, K extends keyof T>(
  obj: T,
  method: K,
  implementation: Function
): { restore: () => void } {
  const original = obj[method];
  obj[method] = implementation as any;
  
  return {
    restore: () => {
      obj[method] = original;
    }
  };
}
/* eslint-enable */

// Run the tests
async function runTests() {
  const runner = new TestRunner();
  
  runner.describe('ThinkingServiceImpl', () => {
    let thinkingService: ThinkingServiceImpl;
    let stubs: { restore: () => void }[] = [];
    
    runner.beforeEach(() => {
      // Reset stubs
      stubs = [];
      
      // Stub thinkingModelFactory
      stubs.push(createStub(thinkingModelFactory, 'getModel', (modelName: string) => {
        if (modelName === 'unknown_model') {
          throw new Error('Unknown thinking model: unknown_model');
        }
        return {
          name: modelName,
          description: 'Test model',
          tokenLimit: 'moderate',
          complexity: 'medium'
        } as ThinkingModel;
      }));
      
      // Stub memoryService
      stubs.push(createStub(memoryService, 'storeMemory', async () => undefined));
      stubs.push(createStub(memoryService, 'retrieveMemory', async () => []));
      
      // Stub cacheService
      stubs.push(createStub(cacheService, 'checkCache', async () => null));
      stubs.push(createStub(cacheService, 'storeCache', async () => undefined));
      
      // Stub tokenOptimizer
      stubs.push(createStub(tokenOptimizer, 'optimizeTokenUsage', () => ({
        selected_model: 'standard',
        estimated_tokens: 1000,
        optimized_tokens: 800,
        token_savings: 200,
        optimization_strategy: 'full_thinking'
      })));
      stubs.push(createStub(tokenOptimizer, 'performOptimizationMaintenance', async () => 0));
      
      // Stub fs
      stubs.push(createStub(fs, 'existsSync', () => true));
      stubs.push(createStub(fs, 'mkdirSync', () => {}));
      stubs.push(createStub(fs, 'writeFileSync', () => {}));
      stubs.push(createStub(fs, 'readFileSync', () => '[]'));
      stubs.push(createStub(fs, 'readdirSync', () => []));
      stubs.push(createStub(fs, 'statSync', () => ({ mtimeMs: Date.now() })));
      stubs.push(createStub(fs, 'unlinkSync', () => {}));
      
      // Create a new instance for each test
      thinkingService = new ThinkingServiceImpl();
    });
    
    runner.afterEach(() => {
      // Restore all stubs
      for (const stub of stubs) {
        stub.restore();
      }
    });
    
    runner.describe('decomposePrompt', () => {
      runner.it('should throw error for unknown thinking model', async () => {
        // Arrange
        const problem = 'Test problem';
        const thinkingModel = 'unknown_model';
        
        // Act & Assert
        await Assert.throws(
          async () => await thinkingService.decomposePrompt(problem, thinkingModel),
          'Unknown thinking model: unknown_model'
        );
      });
      
      runner.it('should return steps for valid thinking model', async () => {
        // Arrange
        const problem = 'Test problem';
        const thinkingModel = 'standard';
        
        // Act
        const result = await thinkingService.decomposePrompt(problem, thinkingModel);
        
        // Assert
        Assert.ok(result);
        Assert.ok(Array.isArray(result));
        Assert.ok(result.length > 0);
      });
      
      runner.it('should add domain-specific steps for algorithm problems', async () => {
        // Arrange
        const problem = 'Design an efficient algorithm for sorting';
        const thinkingModel = 'standard';
        
        // Act
        const result = await thinkingService.decomposePrompt(problem, thinkingModel);
        
        // Assert
        Assert.ok(result);
        const algorithmStep = result.find(step => 
          step.description.includes('algorithm complexity')
        );
        Assert.ok(algorithmStep);
      });
    });
    
    runner.describe('executeThinkingStep', () => {
      runner.it('should execute a thinking step and return updated state', async () => {
        // Arrange
        const stepId = '1';
        const description = 'Analyze problem requirements';
        const reasoning = 'Understanding requirements is important';
        const currentState = {
          problem: 'Test problem',
          response: undefined
        };
        
        // Act
        const result = await thinkingService.executeThinkingStep(
          stepId,
          description,
          reasoning,
          currentState
        );
        
        // Assert
        Assert.ok(result);
        Assert.strictEqual(result.problem, currentState.problem);
        Assert.ok(result.response.includes(`Step ${stepId}: ${description}`));
        Assert.ok(result.response.includes(`Reasoning: ${reasoning}`));
      });
    });
    
    runner.describe('initiateThinkingProcess', () => {
      runner.it('should initiate thinking process and return response', async () => {
        // Arrange
        const request = {
          problem: 'Test problem',
          thinking_model: 'standard'
        };
        
        // Act
        const result = await thinkingService.initiateThinkingProcess(request);
        
        // Assert
        Assert.ok(result);
        Assert.ok(result.documentation);
        Assert.ok(result.documentation.steps);
        Assert.ok(Array.isArray(result.documentation.steps));
      });
      
      runner.it('should throw error for missing problem', async () => {
        // Arrange
        const request = {
          problem: '',
          thinking_model: 'standard'
        };
        
        // Act & Assert
        await Assert.throws(
          async () => await thinkingService.initiateThinkingProcess(request),
          'Problem statement is required'
        );
      });
    });
  });
  
  await runner.run();
}

// Run the tests when this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}