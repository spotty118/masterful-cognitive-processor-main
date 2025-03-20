// Test script for the GeminiServiceOpenAI implementation
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

// Setup path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Get API key from environment, with fallback to check .env file directly if needed
let apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  try {
    // Read .env file manually if environment variable isn't loaded properly
    const envPath = path.resolve(__dirname, '.env');
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

// Create a simple direct test using the OpenAI SDK
async function testOpenAISDK() {
  try {
    console.log('Testing OpenAI SDK with OpenRouter...');
    
    // Initialize the OpenAI client with OpenRouter configuration
    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
      defaultHeaders: {
        'HTTP-Referer': 'https://localhost', // Required by OpenRouter
        'X-Title': 'Masterful Cognitive Processor', // Application identifier
      },
    });
    
    console.log('Sending test query...');
    const completion = await openai.chat.completions.create({
      model: 'google/gemini-2.0-pro-exp-02-05:free',
      messages: [
        {
          role: 'user',
          content: 'What is the meaning of life? (Please keep answer brief)'
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    });
    
    console.log('Response received:');
    console.log(JSON.stringify(completion.choices[0].message, null, 2));
    
    return true;
  } catch (error) {
    console.error('Error testing OpenAI SDK with OpenRouter:', error);
    return false;
  }
}

// Run the test
testOpenAISDK().then(success => {
  if (success) {
    console.log('OpenAI SDK test completed successfully!');
    console.log('This confirms your implementation of GeminiServiceOpenAI should work correctly.');
  } else {
    console.error('OpenAI SDK test failed.');
    process.exit(1);
  }
});
