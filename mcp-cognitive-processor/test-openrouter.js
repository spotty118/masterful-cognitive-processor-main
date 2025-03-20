// Test script for validating OpenRouter API authentication
import { GeminiService } from './build/services/GeminiService.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();
const apiKey = process.env.OPENROUTER_API_KEY || '';

console.log('API Key loaded:', apiKey ? 'Yes (length: ' + apiKey.length + ')' : 'No');

if (!apiKey) {
  console.error('ERROR: No OpenRouter API key found. Make sure OPENROUTER_API_KEY is set in your .env file.');
  process.exit(1);
}

// Initialize GeminiService with the API key
const service = new GeminiService(apiKey);
console.log('GeminiService created successfully');

// Test the API connection with a simple query
async function testConnection() {
  try {
    console.log('Testing API connection with OpenRouter...');
    
    const response = await service.query({
      inputs: 'Hello, can you verify this connection is working?',
      max_tokens: 50,
      temperature: 0.7
    });
    
    console.log('API TEST SUCCESS!');
    console.log('Response received:');
    console.log(JSON.stringify(response, null, 2));
    
    return true;
  } catch (error) {
    console.error('API TEST FAILED!');
    console.error('Error connecting to OpenRouter API:');
    console.error(error);
    
    if (error.message && error.message.includes('Authentication Error')) {
      console.error('\nAuthentication Error Details:');
      console.error('- Check that your OPENROUTER_API_KEY is correct');
      console.error('- Verify the API key has not expired');
      console.error('- Ensure you have sufficient credits in your OpenRouter account');
    }
    
    return false;
  }
}

// Run the test
testConnection().then(success => {
  if (success) {
    console.log('All tests passed. OpenRouter API authentication is working correctly.');
  } else {
    console.error('Tests failed. Please check the errors above.');
    process.exit(1);
  }
});