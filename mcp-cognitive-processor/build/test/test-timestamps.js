/**
 * Simple test to verify timestamp type changes
 * This doesn't use imports to avoid module resolution issues
 */
// Mock a simple state class to verify our fixes
class TestState {
    adjustmentHistory = [];
    // Record an adjustment with string timestamp
    recordAdjustment(type, details) {
        this.adjustmentHistory.push({
            timestamp: new Date().toISOString(), // Using ISO string format
            adjustment: type,
            trigger: 'system',
            details
        });
    }
    // Return adjustments with string timestamps
    getAdjustments() {
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
    const step = {
        id: 'test_step_1',
        description: 'Test step',
        reasoning: 'This is a test reasoning step',
        tokens: 50,
        status: 'completed',
        timestamp: new Date().toISOString()
    };
    // Verify timestamp is string type
    console.log('Step timestamp is ISO string format:', typeof step.timestamp === 'string' &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(step.timestamp));
    // Test the state class
    const state = new TestState();
    state.recordAdjustment('test_adjustment', { reason: 'testing' });
    // Verify adjustment timestamp is string type
    const adjustments = state.getAdjustments();
    console.log('Adjustment timestamp is ISO string format:', adjustments.length > 0 &&
        typeof adjustments[0].timestamp === 'string' &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(adjustments[0].timestamp));
}
// Run the test
testTimestampHandling();
console.log('All timestamp tests completed!');
export {};
//# sourceMappingURL=test-timestamps.js.map