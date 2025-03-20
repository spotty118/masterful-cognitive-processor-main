// Test script for ThinkingServiceImpl with GeminiServiceOpenAI integration
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ServiceFactory } from './src/factories/ServiceFactory.js';
import { TokenOptimizerImpl } from './src/utils/TokenOptimizerImpl.js';
import { ThinkingServiceImpl } from './src/services/ThinkingServiceImpl.js';
import { GeminiServiceOpenAI } from './src/services/GeminiServiceOpenAI.js';

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

// Define a simple test problem for the thinking service
const testProblem = "What are three ways to improve software performance? (Keep the answer brief)";

async function testThinkingService() {
  try {
    console.log('Creating ThinkingServiceImpl with GeminiServiceOpenAI...');
    
    // Create a test configuration
    const config = ServiceFactory.getDefaultConfig();
    
    // Create a token optimizer
    const tokenOptimizer = new TokenOptimizerImpl();
    
    // Create a GeminiServiceOpenAI instance
    const geminiService = new GeminiServiceOpenAI(apiKey);
    
    // Create ThinkingServiceImpl with our dependencies
    const thinkingService = new ThinkingServiceImpl(
      ServiceFactory,
      tokenOptimizer,
      config,
      geminiService
    );
    
    console.log('Initiating thinking process...');
    const result = await thinkingService.initiateThinkingProcess({
      problem: testProblem,
      thinking_model: 'standard',
      include_visualization: false,
      optimize_tokens: true
    });
    
    console.log('Thinking process completed successfully!');
    console.log(`Process ID: ${result.processId}`);
    console.log(`Duration: ${result.duration}ms`);
    console.log(`Model used: ${result.model}`);
    console.log('Steps:');
    result.steps.forEach((step, index) => {
      console.log(`Step ${index + 1}: ${step.type} (${step.tokens} tokens)`);
      console.log(step.content.substring(0, 100) + (step.content.length > 100 ? '...' : ''));
    });
    
    return true;
  } catch (error) {
    console.error('Error testing ThinkingServiceImpl:', error);
    return false;
  }
}

// Run the test
testThinkingService().then(success => {
  if (success) {
    console.log('ThinkingServiceImpl test completed successfully!');
  } else {
    console.error('ThinkingServiceImpl test failed.');
    process.exit(1);
  }
});