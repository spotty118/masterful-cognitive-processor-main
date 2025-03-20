/**
 * Simple test for multi-model pipeline using JavaScript instead of TypeScript
 */

import { ProcessingPipelineOrchestrator } from './build/services/ProcessingPipelineOrchestrator.js';
import { DeepSeekServiceAdapter } from './build/services/DeepSeekServiceAdapter.js';
import { GoogleFlashServiceAdapter } from './build/services/GoogleFlashServiceAdapter.js';
import { GeminiServiceAdapter } from './build/services/GeminiServiceAdapter.js';
import { ClaudeServiceAdapter } from './build/services/ClaudeServiceAdapter.js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Get API key from environment, with fallback to check .env file directly if needed
let openrouterApiKey = process.env.OPENROUTER_API_KEY;
if (!openrouterApiKey) {
  try {
    // Read .env file manually if environment variable isn't loaded properly
    const envPath = path.resolve(process.cwd(), '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/OPENROUTER_API_KEY=([^\r\n]+)/);
    if (match && match[1]) {
      openrouterApiKey = match[1].trim();
      console.log('OpenRouter API key loaded directly from .env file');
    }
  } catch (err) {
    console.error('Error reading .env file:', err);
  }
}

// Similarly try to get Claude API key if available
let claudeApiKey = process.env.CLAUDE_API_KEY;
if (!claudeApiKey) {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/CLAUDE_API_KEY=([^\r\n]+)/);
    if (match && match[1]) {
      claudeApiKey = match[1].trim();
      console.log('Claude API key loaded directly from .env file');
    }
  } catch (err) {
    console.error('Error reading .env file:', err);
  }
}

// Validate we have the OpenRouter API key
if (!openrouterApiKey) {
  console.error('ERROR: No OpenRouter API key found - required for the pipeline');
  process.exit(1);
}

console.log(`OpenRouter API Key loaded (${openrouterApiKey.length} chars): ${openrouterApiKey.substring(0, 5)}...${openrouterApiKey.substring(openrouterApiKey.length - 3)}`);
if (claudeApiKey) {
  console.log(`Claude API Key loaded (${claudeApiKey.length} chars): ${claudeApiKey.substring(0, 5)}...${claudeApiKey.substring(claudeApiKey.length - 3)}`);
} else {
  console.log('Note: Claude API Key not found, will use OpenRouter for Claude model as well');
}

async function testPipeline() {
  try {
    console.log('Testing multi-model pipeline...');
    
    // Initialize services directly
    console.log('Initializing services...');
    const deepSeekService = new DeepSeekServiceAdapter(openrouterApiKey);
    const googleFlashService = new GoogleFlashServiceAdapter(openrouterApiKey);
    const geminiService = new GeminiServiceAdapter(openrouterApiKey);
    
    // Use direct Claude API key if available, otherwise use OpenRouter
    const claudeService = claudeApiKey 
      ? new ClaudeServiceAdapter(claudeApiKey)
      : new ClaudeServiceAdapter(openrouterApiKey);
    
    // Define pipeline steps
    const pipelineSteps = [
      {
        name: 'Initial Preprocessing',
        description: 'Gemini Flash preprocesses and structures the query',
        service: 'googleflash',
        priority: 1
      },
      {
        name: 'Advanced Preprocessing',
        description: 'Gemini Pro further refines the problem structure',
        service: 'gemini',
        priority: 2
      },
      {
        name: 'Preliminary Reasoning',
        description: 'DeepSeek performs initial reasoning steps and problem analysis',
        service: 'deepseek',
        priority: 3
      },
      {
        name: 'Final Reasoning',
        description: 'Claude finalizes the reasoning process with high-quality insights',
        service: 'claude',
        priority: 4
      }
    ];
    
    // Create pipeline orchestrator
    console.log('Creating pipeline orchestrator...');
    const orchestrator = new ProcessingPipelineOrchestrator(
      deepSeekService,
      googleFlashService,
      geminiService,
      claudeService,
      pipelineSteps,
      { parallelStepLimit: 1 } // Ensure sequential processing
    );
    
    // Test query
    const testPrompt = "Explain how quantum computing differs from classical computing. Keep your answer brief.";
    
    console.log('Processing query through pipeline:', testPrompt);
    const result = await orchestrator.process(testPrompt);
    
    // Output results
    console.log('\nResults:');
    console.log('Final Result:');
    console.log(result.finalResult);
    
    console.log('\nToken Usage:');
    console.log(`Total tokens: ${result.totalTokens}`);
    
    console.log('\nIntermediate Results:');
    for (const step of result.intermediateResults) {
      console.log(`\n--- ${step.metadata.step} (${step.metadata.model}) ---`);
      console.log(`Tokens: ${step.metadata.tokenUsage.total}`);
      console.log(`Result (preview): ${step.result.substring(0, 100)}...`);
    }
    
    console.log('\nPipeline test completed successfully!');
  } catch (error) {
    console.error('ERROR in pipeline test:');
    console.error(error);
  }
}

// Run the test
testPipeline();
