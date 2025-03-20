import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function setupAIServices() {
    try {
        // Load existing env file if it exists
        const envPath = path.join(__dirname, '.env');
        const envExists = fs.existsSync(envPath);
        const existingEnv = envExists ? dotenv.parse(fs.readFileSync(envPath)) : {};

        // Required environment variables
        const requiredVars = {
            GEMINI_API_KEY: 'Your Gemini API key',
            CLAUDE_API_KEY: 'Your Claude API key',
            OPENROUTER_API_KEY: 'Your OpenRouter API key (for Gemini Pro 2)',
        };

        const requiredEnvVars = [
            'OPENAI_API_KEY',
            'GOOGLE_API_KEY',
            'CLAUDE_API_KEY',
            'DEEPSEEK_API_KEY',
        ];

        const envDefaults = {
            OPENAI_API_KEY: 'Your OpenAI API key',
            GOOGLE_API_KEY: 'Your Google API key',
            CLAUDE_API_KEY: 'Your Claude API key',
            DEEPSEEK_API_KEY: 'Your DeepSeek API key',
            USE_OPENAI: 'true',
            USE_GOOGLE_GEMINI: 'true',
            USE_CLAUDE: 'true',
            USE_DEEPSEEK: 'true',
        };
        
        // Optional API keys for additional services
        const optionalApiKeys = {
            HUGGINGFACE_API_KEY: 'Your HuggingFace API key for fallback',
            OPENAI_API_KEY: 'Your OpenAI API key for additional AI capabilities',
            COHERE_API_KEY: 'Your Cohere API key for embedding and retrieval'
        };

        let envContent = '';
        let missingVars = [];

        // Check each required variable
        for (const [key, description] of Object.entries(requiredVars)) {
            if (!process.env[key] && !existingEnv[key]) {
                missingVars.push(`${key} (${description})`);
            }
            envContent += `${key}=${process.env[key] || existingEnv[key] || ''}\n`;
        }

        // Additional configuration
        envContent += `\n# AI Service Configuration\n`;
        envContent += `USE_GEMINI=true\n`;
        envContent += `USE_CLAUDE=true\n`;
        envContent += `FALLBACK_TO_HUGGINGFACE=true\n`;
        envContent += `ENABLE_GEMINI_FLASH_FALLBACK=true\n`;
        
        // Add optional API keys
        for (const [key, description] of Object.entries(optionalApiKeys)) {
            envContent += `${key}=${process.env[key] || existingEnv[key] || ''}\n`;
        }
        
        // Strategy Selection Configuration
        envContent += `\n# Strategy Selection Configuration\n`;
        envContent += `ENABLE_ML_STRATEGY_SELECTION=${process.env.ENABLE_ML_STRATEGY_SELECTION || existingEnv.ENABLE_ML_STRATEGY_SELECTION || 'false'}\n`;
        envContent += `ENABLE_DYNAMIC_STRATEGY_SWITCHING=${process.env.ENABLE_DYNAMIC_STRATEGY_SWITCHING || existingEnv.ENABLE_DYNAMIC_STRATEGY_SWITCHING || 'false'}\n`;
        envContent += `STRATEGY_FEEDBACK_ENABLED=${process.env.STRATEGY_FEEDBACK_ENABLED || existingEnv.STRATEGY_FEEDBACK_ENABLED || 'true'}\n`;
        
        // Thinking Strategies Configuration
        envContent += `\n# Thinking Strategies Configuration\n`;
        envContent += `ENABLE_COMPOSITE_STRATEGY=${process.env.ENABLE_COMPOSITE_STRATEGY || existingEnv.ENABLE_COMPOSITE_STRATEGY || 'true'}\n`;
        envContent += `ENABLE_STRATEGY_COMPETITION=${process.env.ENABLE_STRATEGY_COMPETITION || existingEnv.ENABLE_STRATEGY_COMPETITION || 'false'}\n`;
        envContent += `DEFAULT_STRATEGY=${process.env.DEFAULT_STRATEGY || existingEnv.DEFAULT_STRATEGY || 'chain_of_thought'}\n`;
        
        // AI Service Integration Configuration
        envContent += `\n# AI Service Integration Configuration\n`;
        envContent += `ENABLE_PARALLEL_REQUESTS=${process.env.ENABLE_PARALLEL_REQUESTS || existingEnv.ENABLE_PARALLEL_REQUESTS || 'false'}\n`;
        envContent += `SERVICE_TIMEOUT_MS=${process.env.SERVICE_TIMEOUT_MS || existingEnv.SERVICE_TIMEOUT_MS || '60000'}\n`;
        envContent += `SERVICE_MAX_RETRIES=${process.env.SERVICE_MAX_RETRIES || existingEnv.SERVICE_MAX_RETRIES || '3'}\n`;
        envContent += `OPENROUTER_TIMEOUT_MS=${process.env.OPENROUTER_TIMEOUT_MS || existingEnv.OPENROUTER_TIMEOUT_MS || '60000'}\n`;
        envContent += `OPENROUTER_MAX_RETRIES=${process.env.OPENROUTER_MAX_RETRIES || existingEnv.OPENROUTER_MAX_RETRIES || '3'}\n`;
        envContent += `OPENROUTER_RETRY_DELAY_MS=${process.env.OPENROUTER_RETRY_DELAY_MS || existingEnv.OPENROUTER_RETRY_DELAY_MS || '2000'}\n`;
        envContent += `OPENROUTER_ADAPTIVE_TIMEOUT=${process.env.OPENROUTER_ADAPTIVE_TIMEOUT || existingEnv.OPENROUTER_ADAPTIVE_TIMEOUT || 'true'}\n`;
        
        // Memory Management Configuration
        envContent += `\n# Memory Management Configuration\n`;
        envContent += `ENABLE_SEMANTIC_MEMORY=${process.env.ENABLE_SEMANTIC_MEMORY || existingEnv.ENABLE_SEMANTIC_MEMORY || 'false'}\n`;
        envContent += `ENABLE_HIERARCHICAL_MEMORY=${process.env.ENABLE_HIERARCHICAL_MEMORY || existingEnv.ENABLE_HIERARCHICAL_MEMORY || 'false'}\n`;
        envContent += `MEMORY_RELEVANCE_THRESHOLD=${process.env.MEMORY_RELEVANCE_THRESHOLD || existingEnv.MEMORY_RELEVANCE_THRESHOLD || '0.7'}\n`;
        
        // Token Optimization Configuration
        envContent += `\n# Token Optimization Configuration\n`;
        envContent += `ENABLE_CONTENT_CHUNKING=${process.env.ENABLE_CONTENT_CHUNKING || existingEnv.ENABLE_CONTENT_CHUNKING || 'true'}\n`;
        envContent += `ENABLE_DYNAMIC_TOKEN_BUDGETING=${process.env.ENABLE_DYNAMIC_TOKEN_BUDGETING || existingEnv.ENABLE_DYNAMIC_TOKEN_BUDGETING || 'true'}\n`;
        envContent += `MAX_TOKENS_PER_REQUEST=${process.env.MAX_TOKENS_PER_REQUEST || existingEnv.MAX_TOKENS_PER_REQUEST || '4096'}\n`;

        if (answers.setupDeepSeek) {
            envContent += `USE_DEEPSEEK=true\n`;
        } else {
            envContent += `USE_DEEPSEEK=false\n`;
        }

        // Write to .env file
        fs.writeFileSync(envPath, envContent);

        if (missingVars.length > 0) {
            console.warn('\nWarning: The following environment variables are missing:');
            missingVars.forEach(v => console.warn(`- ${v}`));
            console.warn('\nPlease add them to your .env file at:', envPath);
        } else {
            console.log('AI services configuration complete.');
        }

        // Create necessary directories
        const directories = [
            path.join(__dirname, 'data'),
            path.join(__dirname, 'data', 'cache'),
            path.join(__dirname, 'data', 'embeddings'),
            path.join(__dirname, 'data', 'memory'),
            path.join(__dirname, 'data', 'thinking'),
            path.join(__dirname, 'data', 'openai'),
            path.join(__dirname, 'data', 'gemini'),
            path.join(__dirname, 'data', 'claude'),
            path.join(__dirname, 'data', 'deepseek'),
        ];

        directories.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

    } catch (error) {
        console.error('Error setting up AI services:', error);
        process.exit(1);
    }
}

setupAIServices().catch(console.error);