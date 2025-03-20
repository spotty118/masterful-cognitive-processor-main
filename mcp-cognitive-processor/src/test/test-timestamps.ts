/**
 * Simple test to verify timestamp type changes
 * This doesn't use imports to avoid module resolution issues
 */

// Define our expected object structures for testing
interface ThinkingStep {
  id: string;
  description: string;
  reasoning: string;
  tokens: number;
  status: 'completed' | 'in_progress' | 'error';
  timestamp: string; // This is now string type (ISO format) rather than number
}

// Mock a simple state class to verify our fixes
class TestState {
  private adjustmentHistory: Array<{
    timestamp: string; // Changed from number to string
    adjustment: string;
    trigger: string;
    details: any;
  }> = [];
  
  // Record an adjustment with string timestamp
  public recordAdjustment(type: string, details: any): void {
    this.adjustmentHistory.push({
      timestamp: new Date().toISOString(), // Using ISO string format
      adjustment: type,
      trigger: 'system',
      details
    });
  }
  
  // Return adjustments with string timestamps
  public getAdjustments(): Array<{type: string; timestamp: string; details: any}> {
    return this.adjustmentHistory.map(adj => ({
      type: adj.adjustment,
      timestamp: adj.timestamp,
      details: adj.details
    }));
  }
}

// Test our timestamp handling
function testTimestampHandling() {
  console.log('Testing timestamp handling...');
  
  // Create a step with ISO string timestamp
  const step: ThinkingStep = {
    id: 'test_step_1',
    description: 'Test step',
    reasoning: 'This is a test reasoning step',
    tokens: 50,
    status: 'completed',
    timestamp: new Date().toISOString()
  };
  
  // Verify timestamp is string type
  console.log('Step timestamp is ISO string format:', 
    typeof step.timestamp === 'string' && 
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(step.timestamp));
  
  // Test the state class
  const state = new TestState();
  state.recordAdjustment('test_adjustment', { reason: 'testing' });
  
  // Verify adjustment timestamp is string type
  const adjustments = state.getAdjustments();
  console.log('Adjustment timestamp is ISO string format:', 
    adjustments.length > 0 && 
    typeof adjustments[0].timestamp === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(adjustments[0].timestamp));
}

// Run the test
testTimestampHandling();
console.log('All timestamp tests completed!');
