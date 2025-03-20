#!/usr/bin/env node

/**
 * CommonJS wrapper for the MCP server
 * This script sets up the environment and runs the server
 */

// Set the data directory path
const path = require('path');
const fs = require('fs');

// Ensure we use a relative path for data directory
process.env.MCP_DB_DIR = path.join(__dirname, 'data');

// Ensure the data directory exists
const dataDir = process.env.MCP_DB_DIR;
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Run the server
console.log('Starting MCP server...');
console.log('Data directory:', dataDir);

// Import and run the ES module
import('./build/main.js').catch(err => {
  console.error('Error running MCP server:', err);
  process.exit(1);
});