import { DeepSeekServiceAdapter } from './build/services/DeepSeekServiceAdapter.js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Get API key from environment, with fallback to check .env file directly if needed
let apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  try {
    // Read .env file manually if environment variable isn't loaded properly
    const envPath = path.resolve(process.cwd(), '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/OPENROUTER_API_KEY=([^\r\n]+)/);
    if (match && match[1]) {
      apiKey = match[1].trim();
      console.log('API key loaded directly from .env file');
    }
  } catch (err) {
    console.error('Error reading .env file:', err);
  }
}

if (!apiKey) {
  console.error('ERROR: No OpenRouter API key found');
  process.exit(1);
}

console.log(`API Key loaded (${apiKey.length} chars): ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);

// Initialize DeepSeek service with OpenRouter
const deepseekService = new DeepSeekServiceAdapter(apiKey);

async function testDeepSeek() {
  try {
    console.log('Testing DeepSeek via OpenRouter API...');
    
    const response = await deepseekService.query({
      messages: [
        {
          role: 'user',
          content: 'What is the meaning of life? (Please keep answer brief)'
        }
      ],
      temperature: 0.7,
      maxTokens: 100
    });

    console.log('API TEST SUCCESS!');
    console.log('Response:');
    console.log(JSON.stringify(response, null, 2));
    
    return true;
  } catch (error) {
    console.error('API TEST FAILED!');
    console.error('Error connecting to OpenRouter API for DeepSeek:');
    console.error(error);
    
    if (error.message?.includes('Authentication')) {
      console.error('\nAuthentication Error Details:');
      console.error('- Check that your OPENROUTER_API_KEY is correct');
      console.error('- Verify the API key has not expired');
      console.error('- Ensure you have sufficient credits in your OpenRouter account');
    }
    
    return false;
  }
}

// Run the test
testDeepSeek().then(success => {
  if (success) {
    console.log('Test completed successfully!');
  } else {
    console.error('Test failed. Please check the errors above.');
    process.exit(1);
  }
});