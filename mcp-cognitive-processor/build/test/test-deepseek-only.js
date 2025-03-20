/**
 * Simple test that focuses only on DeepSeek service
 */
import { DIServiceFactory } from '../factories/DIServiceFactory.js';
// Load environment variables
import dotenv from 'dotenv';
dotenv.config();
async function main() {
    console.log('Starting DeepSeek-only test...');
    try {
        // Initialize DIServiceFactory
        console.log('Initializing DIServiceFactory...');
        // Ensure OpenRouter API key is set
        if (!process.env.OPENROUTER_API_KEY) {
            console.error('OPENROUTER_API_KEY is not set - cannot proceed');
            return;
        }
        console.log('OPENROUTER_API_KEY is available, proceeding with initialization...');
        // Initialize services
        await DIServiceFactory.initialize();
        console.log('DIServiceFactory initialized successfully!');
        // Wait for services to register
        console.log('Waiting for services to fully initialize...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        // Check if DeepSeek service is available
        const hasDeepSeek = DIServiceFactory.hasService('deepSeekService');
        console.log('DeepSeek service available:', hasDeepSeek);
        if (!hasDeepSeek) {
            console.error('DeepSeek service is not available - test cannot continue');
            return;
        }
        // Get the DeepSeek service
        console.log('Retrieving DeepSeek service...');
        const deepSeekService = DIServiceFactory.getService('deepSeekService');
        // Simple query to test
        const testQuery = "What is the capital of France? (Please keep answer very brief)";
        console.log('Sending test query to DeepSeek:', testQuery);
        const result = await deepSeekService.query({
            messages: [{ role: 'user', content: testQuery }],
            temperature: 0.7,
            maxTokens: 100
        });
        console.log('\nTest Results:');
        console.log('Response:', result.choices[0].message.content);
        console.log('Token usage:', result.usage?.total || 'unknown');
        console.log('\nTest completed successfully!');
    }
    catch (error) {
        console.error('\nERROR DETAILS:');
        if (error instanceof Error) {
            console.error('- Name:', error.name);
            console.error('- Message:', error.message);
            console.error('- Stack:', error.stack);
        }
        else {
            console.error('- Unknown error type:', error);
            try {
                console.error('- Stringified:', JSON.stringify(error));
            }
            catch (e) {
                console.error('- Could not stringify error');
            }
        }
    }
}
// Run the test
main().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
});
//# sourceMappingURL=test-deepseek-only.js.map