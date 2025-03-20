#!/usr/bin/env node

/**
 * Script to test different method name formats with the MCP server
 */
import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the MCP server script
const serverPath = join(__dirname, 'run-server.cjs');

// Test different method name formats
const methodFormats = [
  // Standard format
  "list",  
  "call",
  // Namespace format
  "tools.list",
  "tools.call", 
  // MCP namespace format
  "mcp.tools.list",
  "mcp.tools.call",
  // Path format 
  "tools/list",
  "tools/call",
  // MCP path format
  "mcp/tools/list",
  "mcp/tools/call"
];

// Create test requests for each method format
const testRequests = [];
let id = 1;

methodFormats.forEach(method => {
  // Format for list
  if (method.includes('list')) {
    testRequests.push({
      id: String(id++),
      name: `List (${method})`,
      request: {
        jsonrpc: '2.0',
        id: String(id),
        method: method,
        params: {}
      }
    });
  }
  
  // Format for call
  if (method.includes('call')) {
    testRequests.push({
      id: String(id++),
      name: `Call (${method})`,
      request: {
        jsonrpc: '2.0',
        id: String(id),
        method: method,
        params: {
          name: 'generate_with_mcp',
          arguments: {
            prompt: 'Test prompt',
            model: "standard"
          }
        }
      }
    });
  }
});

// Save results to a file
const resultsPath = join(__dirname, 'method-test-results.json');
const results = {
  timestamp: new Date().toISOString(),
  tests: [],
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

// Add global timeout
const GLOBAL_TIMEOUT = 60000;
const globalTimer = setTimeout(() => {
  console.error(`Test timed out after 60 seconds`);
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`Results saved to ${resultsPath}`);
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
  // When server is ready, start the tests
  if (line.includes('MCP Cognitive Processor running on stdio')) {
    console.log('MCP server is ready. Starting tests...');
    setTimeout(runNextTest, 1000);
  } 
  // Handle JSON responses
  else if (line.startsWith('{')) {
    try {
      const response = JSON.parse(line);
      handleResponse(response);
    } catch (error) {
      console.log('Server output (not JSON):', line);
    }
  } else {
    console.log('Server output:', line);
  }
});

// Handle server errors
serverProcess.stderr.on('data', (data) => {
  const errorOutput = data.toString();
  
  // Check if the server ready message is in stderr instead of stdout
  if (errorOutput.includes('MCP Cognitive Processor running on stdio')) {
    console.log('MCP server is ready (detected from stderr). Starting tests...');
    setTimeout(runNextTest, 1000);
  } else {
    console.error('Server error:', errorOutput);
  }
});

// Handle server exit
serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Run the tests sequentially
let currentTestIndex = 0;

function runNextTest() {
  if (currentTestIndex < testRequests.length) {
    const test = testRequests[currentTestIndex];
    console.log(`\nRunning test ${currentTestIndex + 1}/${testRequests.length}: ${test.name}`);
    
    // Log the request we're about to send
    const requestStr = JSON.stringify(test.request);
    console.log(`Sending request: ${requestStr}`);
    
    try {
      serverProcess.stdin.write(requestStr + '\n');
      console.log('Request sent successfully');
    } catch (err) {
      console.error('Error sending request:', err);
      // Record the error
      results.tests.push({
        ...test,
        success: false,
        error: `Failed to send request: ${err.message}`,
        timestamp: new Date().toISOString()
      });
      currentTestIndex++;
      setTimeout(runNextTest, 1000);
    }
  } else {
    console.log('\nAll tests completed!');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`Results saved to ${resultsPath}`);
    // Clear the global timeout
    clearTimeout(globalTimer);
    serverProcess.kill();
    process.exit(0);
  }
}

function handleResponse(response) {
  if (currentTestIndex < testRequests.length) {
    const test = testRequests[currentTestIndex];
    
    if (response.id === test.request.id) {
      console.log(`Response for ${test.name}:`);
      
      // Record the result
      const testResult = {
        ...test,
        response: response,
        success: !response.error,
        timestamp: new Date().toISOString()
      };
      
      if (response.error) {
        console.error('Error:', JSON.stringify(response.error, null, 2));
        console.log(`Test ${test.name} failed!`);
      } else {
        console.log('Success!');
      }
      
      results.tests.push(testResult);
      
      // Move to the next test
      currentTestIndex++;
      setTimeout(runNextTest, 1000);
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('Test interrupted');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`Results saved to ${resultsPath}`);
  clearTimeout(globalTimer);
  serverProcess.kill();
  process.exit(1);
});