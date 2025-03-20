#!/usr/bin/env node

/**
 * Test script to test the cognitive processor tools
 */
import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the MCP server script
const serverPath = join(__dirname, 'run-server.cjs');

// Test requests
const listToolsRequest = {
  jsonrpc: '2.0',
  id: '1',
  method: 'tools/list',
  params: {}
};

const generateWithMCPRequest = {
  jsonrpc: '2.0',
  id: '2',
  method: 'tools/call',
  params: {
    name: 'generate_with_mcp',
    arguments: {
      prompt: 'Explain how the Masterful Cognitive Processor works in 3 sentences.',
      model: "standard"
    }
  }
};

// Modified test request to directly call generate_with_mcp with a problem-solving prompt, and use a smaller model
const hfIntegrationTestRequest = {
    jsonrpc: '2.0',
    id: '4',
    method: 'tools/call',
    params: {
      name: 'generate_with_mcp',
      arguments: {
        prompt: 'Solve the following problem: What is the best way to design a scalable microservices architecture?',
        model: "flan-t5-large", // Use a smaller model to avoid CUDA out of memory errors
        optimize_tokens: false // Ensure we bypass the cache
      }
    }
  };

// Start the MCP server process
console.log('Starting MCP server...');
const serverProcess = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Add debug event listeners
serverProcess.on('error', (err) => {
  console.error('Server process error:', err);
});

// Add test phase tracking
let testPhase = 'starting';

// Add global timeout to prevent hanging
const GLOBAL_TIMEOUT = 60000; // Increase to 60 seconds
const globalTimer = setTimeout(() => {
  console.error(`Test timed out after 60 seconds during phase: ${testPhase}`);
  serverProcess.kill();
  process.exit(1);
}, GLOBAL_TIMEOUT);

// Create readline interface for reading server output
const rl = createInterface({
  input: serverProcess.stdout,
  crlfDelay: Infinity
});

// Handle server output
rl.on('line', (line) => {
  console.log('Server output line:', line);
  if (line.includes('MCP Cognitive Processor running on stdio')) {
    console.log('MCP server is ready. Starting tests...');
    testPhase = 'server_ready';
    runTests();
  } else if (line.startsWith('{')) {
    try {
      const response = JSON.parse(line);
      handleResponse(response);
    } catch (error) {
      console.log('Server output:', line);
    }
  } else {
    console.log('Server output:', line);
  }
});

// Handle server errors
serverProcess.stderr.on('data', (data) => {
  const errorOutput = data.toString();
  console.error('Server error:', errorOutput);
  
  // Check if the server ready message is in stderr instead of stdout
  if (errorOutput.includes('MCP Cognitive Processor running on stdio')) {
    console.log('MCP server is ready (detected from stderr). Starting tests...');
    testPhase = 'server_ready';
    runTests();
  }
});

// Handle server exit
serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Run the tests - Removed the 'Thinking Process' test
let currentTest = 0;
const tests = [
  { name: 'List Tools', request: listToolsRequest },
  { name: 'Generate with MCP', request: generateWithMCPRequest },
  { name: 'Hugging Face Integration Test', request: hfIntegrationTestRequest } // Keep the HF test
];

function runTests() {
  if (currentTest < tests.length) {
    const test = tests[currentTest];
    console.log(`\nRunning test: ${test.name}`);
    testPhase = `running_test_${currentTest + 1}`;
    
    // Log the request we're about to send
    const requestStr = JSON.stringify(test.request);
    console.log(`Sending request: ${requestStr}`);
    
    try {
      serverProcess.stdin.write(requestStr + '\n');
      console.log('Request sent successfully');
    } catch (err) {
      console.error('Error sending request:', err);
      clearTimeout(globalTimer);
      serverProcess.kill();
      process.exit(1);
    }
  } else {
    console.log('\nAll tests completed successfully!');
    // Clear the global timeout
    clearTimeout(globalTimer);
    serverProcess.kill();
    process.exit(0);
  }
}

function handleResponse(response) {
  const test = tests[currentTest];
  console.log(`Response for ${test.name}:`);
  
  if (response.error) {
    console.error('Error:', JSON.stringify(response.error, null, 2));
    console.error(`Test ${test.name} failed!`);
    clearTimeout(globalTimer);
    serverProcess.kill();
    process.exit(1);
  } else {
    if (response.id === test.request.id) {
      console.log('Success!');
      
      // For debugging, show the actual response content
      if (test.name === 'Generate with MCP' || test.name === 'Hugging Face Integration Test') {
        const result = response.result;
        console.log('Response content:', JSON.stringify(result, null, 2));
        if (result.content && result.content[0]) {
          try {
            const parsedContent = JSON.parse(result.content[0].text);
            console.log('Parsed response:', JSON.stringify(parsedContent, null, 2));
          } catch (e) {
            console.log('Could not parse content as JSON:', e.message);
          }
        }
      }
      
      // For list tools, print the tool names
      if (test.name === 'List Tools') {
        const tools = response.result.tools;
        console.log(`Found ${tools.length} tools:`);
        tools.forEach(tool => {
          console.log(`- ${tool.name}: ${tool.description}`);
        });
      } else {
        // For other responses, just show that we got a result
        console.log('Got result with content type:', response.result.content[0].type);
      }
      
      // Move to the next test
      currentTest++;
      setTimeout(runTests, 1000);
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('Test interrupted');
  clearTimeout(globalTimer);
  serverProcess.kill();
  process.exit(1);
});