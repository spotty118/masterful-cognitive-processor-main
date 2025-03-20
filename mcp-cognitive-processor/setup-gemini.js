#!/usr/bin/env node
/**
 * Setup script for switching to Gemini 2.0 Pro via OpenRouter
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the directory where this script is located
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Default configuration path
const configPath = path.join(__dirname, '.env');

console.log('Setting up Gemini 2.0 Pro via OpenRouter...');

// Check if OpenRouter API key is provided
const openrouterApiKey = process.env.OPENROUTER_API_KEY;
if (!openrouterApiKey) {
  console.log('⚠️  Warning: OPENROUTER_API_KEY environment variable not found.');
  console.log('Please set it by running:');
  console.log('export OPENROUTER_API_KEY=your_openrouter_api_key_here');
}

// Create or update .env file
let envContent = '';
if (fs.existsSync(configPath)) {
  envContent = fs.readFileSync(configPath, 'utf8');
}

// Update or add USE_GEMINI=true
if (envContent.includes('USE_GEMINI=')) {
  envContent = envContent.replace(/USE_GEMINI=.*/, 'USE_GEMINI=true');
} else {
  envContent += '\nUSE_GEMINI=true';
}

// Update or add OPENROUTER_API_KEY if available
if (openrouterApiKey) {
  if (envContent.includes('OPENROUTER_API_KEY=')) {
    envContent = envContent.replace(/OPENROUTER_API_KEY=.*/, `OPENROUTER_API_KEY=${openrouterApiKey}`);
  } else {
    envContent += `\nOPENROUTER_API_KEY=${openrouterApiKey}`;
  }
}

// Save updated .env file
fs.writeFileSync(configPath, envContent);

console.log('✅ Setup complete! Gemini 2.0 Pro via OpenRouter has been configured.');
console.log(`Model: google/gemini-2.0-pro-exp-02-05:free`);
console.log('To revert to HuggingFace, set USE_GEMINI=false in your .env file.');