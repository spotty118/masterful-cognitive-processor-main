/**
 * Debug test for service initialization
 * This test focuses solely on checking if services initialize properly
 */

import { DIServiceFactory } from '../factories/DIServiceFactory.js';
import { IAIService } from '../interfaces/IAIService.js';

// Load environment variables
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Manual API key loading from .env file as a fallback
function loadApiKeys() {
  const keys: Record<string, string> = {};
  const requiredKeys = ['OPENROUTER_API_KEY', 'CLAUDE_API_KEY'];
  
  // First try from environment
  for (const key of requiredKeys) {
    if (process.env[key]) {
      keys[key] = process.env[key] as string;
    }
  }
  
  // Then try to read from .env file directly if any are missing
  if (!keys.OPENROUTER_API_KEY || !keys.CLAUDE_API_KEY) {
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      for (const key of requiredKeys) {
        if (!keys[key]) {
          const regex = new RegExp(`${key}=([^\r\n]+)`);
          const match = envContent.match(regex);
          if (match && match[1]) {
            keys[key] = match[1].trim();
            // Set back to process.env so DIServiceFactory can find it
            process.env[key] = keys[key];
            console.log(`${key} loaded directly from .env file`);
          }
        }
      }
    } catch (err) {
      console.error('Error reading .env file:', err);
    }
  }
  
  return keys;
}

async function main() {
  console.log('Starting service initialization debug test...');
  
  try {
    // Load API keys with fallback mechanism
    console.log('Loading API keys...');
    const keys = loadApiKeys();
    
    // Check environment variables
    console.log('API keys loaded:');
    console.log('- OPENROUTER_API_KEY present:', !!keys.OPENROUTER_API_KEY);
    if (keys.OPENROUTER_API_KEY) {
      const key = keys.OPENROUTER_API_KEY;
      console.log(`  Length: ${key.length}, Preview: ${key.substring(0, 5)}...${key.substring(key.length - 3)}`);
    }
    
    console.log('- CLAUDE_API_KEY present:', !!keys.CLAUDE_API_KEY);
    if (keys.CLAUDE_API_KEY) {
      const key = keys.CLAUDE_API_KEY;
      console.log(`  Length: ${key.length}, Preview: ${key.substring(0, 5)}...${key.substring(key.length - 3)}`);
    }
    
    // Only initialize if we have the required keys
    if (!keys.OPENROUTER_API_KEY) {
      console.error('ERROR: Cannot initialize without OPENROUTER_API_KEY');
      return;
    }
    
    // Initialize services
    console.log('\nInitializing DI container...');
    try {
      await DIServiceFactory.initialize();
      console.log('DIServiceFactory initialized successfully');
    } catch (error) {
      console.error('Error during DIServiceFactory initialization:', error);
      throw error;
    }
    
    // Wait for async registration
    console.log('Waiting for services to initialize...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check for registered services
    console.log('\nChecking registered services:');
    const services = [
      'configService', 
      'healthMonitoring', 
      'memoryService', 
      'cachingService',
      'cacheService',
      'tokenOptimizer',
      'geminiService',
      'openRouterService',
      'claudeService',
      'deepSeekService',
      'googleFlashService',
      'modelFallbackService',
      'thinkingService'
    ];
    
    for (const service of services) {
      const isRegistered = DIServiceFactory.hasService(service);
      console.log(`- ${service}: ${isRegistered ? 'Available' : 'Not available'}`);
    }
    
    // Basic test of one service if available
    if (DIServiceFactory.hasService('geminiService')) {
      console.log('\nTesting geminiService...');
      const geminiService = DIServiceFactory.getService('geminiService') as IAIService;
      console.log('- Service type:', typeof geminiService);
      console.log('- Has query method:', 'query' in geminiService);
    }
    
    console.log('\nDebug test completed!');
  } catch (error) {
    console.error('\nERROR DETAILS:');
    if (error instanceof Error) {
      console.error('- Name:', error.name);
      console.error('- Message:', error.message);
      console.error('- Stack:', error.stack);
    } else {
      console.error('- Unknown error type:', error);
      try {
        console.error('- Stringified:', JSON.stringify(error));
      } catch (e) {
        console.error('- Could not stringify error');
      }
    }
  }
}

// Run the test with proper error handling
main().catch(err => {
  console.error('Fatal unhandled error:', err);
  process.exit(1);
});
