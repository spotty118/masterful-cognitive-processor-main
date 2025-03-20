/**
 * Minimal environment check
 * Just loads and displays the API keys without any service initialization
 */

import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Function to safely load API keys
function loadApiKeys() {
  console.log('Attempting to load API keys...');
  
  const keys = {};
  const requiredKeys = ['OPENROUTER_API_KEY', 'CLAUDE_API_KEY'];
  
  // First check environment variables
  for (const key of requiredKeys) {
    if (process.env[key]) {
      keys[key] = process.env[key];
      console.log(`${key} found in process.env`);
    } else {
      console.log(`${key} not found in process.env`);
    }
  }
  
  // If any keys are missing, try to read directly from .env file
  if (!keys.OPENROUTER_API_KEY || !keys.CLAUDE_API_KEY) {
    try {
      console.log('Attempting to read .env file directly...');
      const envPath = path.resolve(process.cwd(), '.env');
      console.log('ENV path:', envPath);
      
      if (fs.existsSync(envPath)) {
        console.log('.env file exists');
        const envContent = fs.readFileSync(envPath, 'utf8');
        console.log('.env file content length:', envContent.length);
        
        for (const key of requiredKeys) {
          if (!keys[key]) {
            const regex = new RegExp(`${key}=([^\\r\\n]+)`);
            const match = envContent.match(regex);
            if (match && match[1]) {
              keys[key] = match[1].trim();
              process.env[key] = keys[key]; // Set back to process.env
              console.log(`${key} loaded directly from .env file`);
            } else {
              console.log(`${key} not found in .env file content`);
            }
          }
        }
      } else {
        console.log('.env file does not exist at path:', envPath);
      }
    } catch (err) {
      console.error('Error reading .env file:', err);
    }
  }
  
  return keys;
}

// Main function
function main() {
  console.log('Starting minimal environment check...');
  
  // Load API keys
  const keys = loadApiKeys();
  
  // Display loaded keys (masked for security)
  console.log('\nAPI Key Status:');
  for (const [keyName, value] of Object.entries(keys)) {
    if (value) {
      console.log(`${keyName}: LOADED (${value.length} chars)`);
      console.log(`  First 5 chars: ${value.substring(0, 5)}...`);
      console.log(`  Last 3 chars: ...${value.substring(value.length - 3)}`);
    } else {
      console.log(`${keyName}: NOT LOADED`);
    }
  }
  
  console.log('\nCheck completed!');
}

// Run the main function
main();
