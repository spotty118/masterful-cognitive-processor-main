/**
 * Tests for IntelligenceService
 * Verifies the service's self-contained processing capabilities
 */

import { processStructuredThinking, performReasoning } from '../../../src/services/intelligenceService';
import * as cacheService from '../../../src/services/cacheService';
import * as memoryService from '../../../src/services/memoryService';
import * as tokenOptimizer from '../../../src/utils/tokenOptimizer';
import * as fs from 'fs';

// Create test runner class (reuse from ThinkingServiceTests)
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
        for (const beforeFn of this.beforeEachFns) {
          beforeFn();
        }
        
        console.log(`Running: ${test.name}`);
        await test.fn();
        
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

// Create assertion class (reuse from ThinkingServiceTests)
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
}

// Create stub helper (reuse from ThinkingServiceTests)
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

// Run the tests
async function runTests() {
  const runner = new TestRunner();
  
  runner.describe('IntelligenceService', () => {
    let stubs: { restore: () => void }[] = [];
    
    runner.beforeEach(() => {
      stubs = [];
      
      // Stub dependencies
      stubs.push(createStub(cacheService, 'checkCache', async () => null));
      stubs.push(createStub(cacheService, 'storeCache', async () => undefined));
      stubs.push(createStub(memoryService, 'storeMemory', async () => undefined));
      stubs.push(createStub(memoryService, 'retrieveMemory', async () => []));
      stubs.push(createStub(tokenOptimizer, 'optimizeTokenUsage', () => ({
        selected_model: 'standard',
        estimated_tokens: 1000,
        optimized_tokens: 800,
        token_savings: 200,
        optimization_strategy: 'full_thinking'
      })));
      stubs.push(createStub(fs, 'existsSync', () => true));
      stubs.push(createStub(fs, 'mkdirSync', () => undefined));
    });
    
    runner.afterEach(() => {
      for (const stub of stubs) {
        stub.restore();
      }
    });
    
    runner.describe('processStructuredThinking', () => {
      runner.it('should process thinking request without external dependencies', async () => {
        // Arrange
        const request = {
          prompt: 'Analyze the performance of a sorting algorithm',
          systemPrompt: 'Use structured thinking approach',
          model: 'internal-processor'
        };
        
        // Act
        const result = await processStructuredThinking(request);
        
        // Assert
        Assert.ok(result.response);
        Assert.strictEqual(result.model, 'internal-processor');
        Assert.ok(result.tokenUsage.total > 0);
        
        // Parse response and verify structure
        const parsed = JSON.parse(result.response);
        Assert.ok(Array.isArray(parsed.steps));
        Assert.ok(typeof parsed.conclusion === 'string');
        Assert.ok(typeof parsed.confidence === 'number');
      });
      
      runner.it('should return cached response when available', async () => {
        // Arrange
        const cachedResponse = {
          response: JSON.stringify({
            steps: [{ id: '1', description: 'Cached step' }],
            conclusion: 'Cached conclusion',
            confidence: 0.8
          }),
          model: 'internal-processor',
          tokenUsage: { prompt: 10, completion: 20, total: 30 }
        };
        
        stubs.push(createStub(cacheService, 'checkCache', async () => cachedResponse));
        
        const request = {
          prompt: 'Test prompt',
          model: 'internal-processor'
        };
        
        // Act
        const result = await processStructuredThinking(request);
        
        // Assert
        Assert.ok(result.cached);
        Assert.deepEqual(result.response, cachedResponse.response);
      });
    });
    
    runner.describe('performReasoning', () => {
      runner.it('should perform reasoning using internal processing', async () => {
        // Arrange
        const request = {
          problem: 'Design a caching system',
          reasoningSystem: 'sequential',
          maxSteps: 3
        };
        
        // Act
        const result = await performReasoning(request);
        
        // Assert
        Assert.ok(Array.isArray(result.steps));
        Assert.strictEqual(result.steps.length, 3);
        Assert.ok(typeof result.conclusion === 'string');
        Assert.ok(result.confidence >= 0 && result.confidence <= 1);
      });
      
      runner.it('should handle errors gracefully', async () => {
        // Arrange
        const request = {
          problem: '',
          reasoningSystem: 'unknown'
        };
        
        // Act
        const result = await performReasoning(request);
        
        // Assert
        Assert.ok(result.steps.length === 1);
        Assert.ok(result.steps[0].description.includes('Error'));
        Assert.strictEqual(result.confidence, 0);
      });
    });
  });
  
  await runner.run();
}

// Run the tests when this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}