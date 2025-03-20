import { GeminiServiceOpenAI } from './src/services/GeminiServiceOpenAI.js';
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

console.log(`API Key found (${apiKey.length} chars): ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);

async function testGeminiServiceOpenAI() {
  try {
    // Ensure apiKey is a string (TypeScript check)
    if (!apiKey) {
      throw new Error('API key is undefined');
    }
    
    console.log('Creating GeminiServiceOpenAI instance...');
    const geminiService = new GeminiServiceOpenAI(apiKey);
    
    console.log('Testing query method...');
    const queryInput = {
      inputs: 'What is the meaning of life? (Please keep answer brief)',
      max_tokens: 100,
      temperature: 0.7
    };
    
    console.log('Sending query:', queryInput);
    const response = await geminiService.query(queryInput);
    
    console.log('Response received:');
    console.log(JSON.stringify(response, null, 2));
    
    return true;
  } catch (error) {
    console.error('Error testing GeminiServiceOpenAI:', error);
    return false;
  }
}

// Run the test
testGeminiServiceOpenAI().then(success => {
  if (success) {
    console.log('GeminiServiceOpenAI test completed successfully!');
  } else {
    console.error('GeminiServiceOpenAI test failed.');
    process.exit(1);
  }
});