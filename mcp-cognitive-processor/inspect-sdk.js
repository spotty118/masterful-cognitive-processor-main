#!/usr/bin/env node

/**
 * Script to inspect MCP SDK in detail
 */
import { 
  ListToolsRequestSchema, 
  CallToolRequestSchema, 
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

// Print the complete schema objects
console.log('Full ListToolsRequestSchema:');
console.log(JSON.stringify(ListToolsRequestSchema, null, 2));

console.log('\nFull CallToolRequestSchema:');
console.log(JSON.stringify(CallToolRequestSchema, null, 2));

// Import and inspect the Server class
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

// Create a minimal test server to inspect how methods are registered
const testServer = new Server(
  {
    name: 'test-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {
        list: true,
        call: true
      },
    },
  }
);

// Add a dummy handler to see how it's registered
testServer.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: []
}));

// Try to inspect the internal server structure
console.log('\nServer Request Handlers:');
console.log(Object.keys(testServer));

// Let's check if there's any documentation about request formats
try {
  console.log('\nTrying to access documentation:');
  import('@modelcontextprotocol/sdk/docs.js')
    .then(docs => {
      console.log('Documentation found:', Object.keys(docs));
    })
    .catch(err => {
      console.log('No documentation module found');
    });
} catch (e) {
  console.log('Error accessing documentation:', e.message);
}

// Let's see if there are any examples we can inspect
console.log('\nLooking for examples:');
try {
  const fs = await import('fs');
  const path = await import('path');
  
  // Assuming the SDK is in node_modules
  const sdkBasePath = path.dirname(require.resolve('@modelcontextprotocol/sdk/package.json'));
  console.log('SDK Base Path:', sdkBasePath);
  
  const examplesPath = path.join(sdkBasePath, 'examples');
  if (fs.existsSync(examplesPath)) {
    console.log('Examples directory found. Contents:');
    console.log(fs.readdirSync(examplesPath));
  } else {
    console.log('No examples directory found');
  }
} catch (e) {
  console.log('Error looking for examples:', e.message);
}