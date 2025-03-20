// Direct API test for OpenRouter
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();
const apiKey = process.env.OPENROUTER_API_KEY || '';

console.log(`API Key loaded (${apiKey.length} chars): ${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}`);

if (!apiKey) {
  console.error('ERROR: No OpenRouter API key found. Make sure OPENROUTER_API_KEY is set in your .env file.');
  process.exit(1);
}

// Simple direct test function
async function testOpenRouter() {
  try {
    console.log('Making direct request to OpenRouter API...');
    
    const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    
    // Request payload
    const payload = {
      model: "google/gemini-2.0-pro-exp-02-05:free",
      messages: [
        {
          role: "user",
          content: "Hello, this is a direct API test."
        }
      ],
      max_tokens: 50
    };
    
    // Request headers
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://localhost',
      'X-Title': 'Masterful Cognitive Processor Direct Test'
    };
    
    console.log('Request headers:', JSON.stringify(Object.keys(headers), null, 2));
    console.log('Request payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Success! API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    return true;
  } catch (error) {
    console.error('Error in direct API test:');
    console.error(error);
    return false;
  }
}

// Run the test
testOpenRouter().then(success => {
  if (success) {
    console.log('Direct API test passed successfully.');
  } else {
    console.error('Direct API test failed.');
    
    console.log('\nPOSSIBLE SOLUTIONS:');
    console.log('1. Visit https://openrouter.ai/keys to verify your API key is valid');
    console.log('2. Check if your OpenRouter account has available credits');
    console.log('3. Check if you need to create a new API key');
    console.log('4. Ensure your API key has appropriate permissions');
    
    process.exit(1);
  }
});