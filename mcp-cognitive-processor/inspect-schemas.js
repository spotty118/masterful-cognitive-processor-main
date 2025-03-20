#!/usr/bin/env node

/**
 * Script to inspect MCP SDK schemas and print their method names
 */
import { 
  ListToolsRequestSchema, 
  CallToolRequestSchema, 
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

// Print the schema details
console.log('MCP SDK Schema Methods:');
console.log('======================');
console.log('ListToolsRequestSchema method:', ListToolsRequestSchema.method);
console.log('CallToolRequestSchema method:', CallToolRequestSchema.method);
console.log('ListResourcesRequestSchema method:', ListResourcesRequestSchema.method);
console.log('ListResourceTemplatesRequestSchema method:', ListResourceTemplatesRequestSchema.method);
console.log('ReadResourceRequestSchema method:', ReadResourceRequestSchema.method);