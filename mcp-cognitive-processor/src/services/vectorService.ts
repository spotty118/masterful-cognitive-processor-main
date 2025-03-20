/**
 * Vector Service
 * Provides vector processing capabilities to enhance Roo's functionality
 */

import { VectorItem } from '../models/types.js';
import { mcpConfig } from '../config/mcp-config.js';
import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

// Define the database file path
const DB_DIR = process.env.MCP_DB_DIR || path.join(process.cwd(), 'data');
const VECTOR_DB_DIR = path.join(DB_DIR, 'vectors');
const VECTOR_DB_FILE = path.join(VECTOR_DB_DIR, 'vector_db.json');

// Initialize vector database
let vectorStore: Map<string, VectorItem> = new Map();

// Ensure the vector database directory exists
if (!fs.existsSync(VECTOR_DB_DIR)) {
  fs.mkdirSync(VECTOR_DB_DIR, { recursive: true });
}

/**
 * Loads vector items from the database file
 */
const loadVectorsFromDisk = (): void => {
  try {
    if (fs.existsSync(VECTOR_DB_FILE)) {
      const data = fs.readFileSync(VECTOR_DB_FILE, 'utf8');
      const items: VectorItem[] = JSON.parse(data);
      vectorStore = new Map(items.map(item => [item.id, item]));
      console.log(`Loaded ${items.length} vector items from database`);
    }
  } catch (error) {
    console.error('Error loading vectors from disk:', error);
    vectorStore = new Map();
  }
};

/**
 * Saves vector items to the database file
 */
const saveVectorsToDisk = (): void => {
  try {
    const items = Array.from(vectorStore.values());
    fs.writeFileSync(VECTOR_DB_FILE, JSON.stringify(items, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving vectors to disk:', error);
  }
};

// Load vector items on startup
loadVectorsFromDisk();

/**
 * Stores a vector item in the database
 */
export const storeVector = async (
  content: string,
  type: string,
  source: string
): Promise<VectorItem> => {
  const hash = createHash('sha256');
  hash.update(`${content}${type}${source}`);
  const id = `vec_${hash.digest('hex').substring(0, 16)}`;
  
  // Return existing item if already stored
  if (vectorStore.has(id)) {
    return vectorStore.get(id) as VectorItem;
  }
  
  // Create a new vector item
  const newItem: VectorItem = {
    id,
    content,
    vector: [], // Vectors are handled by Roo's vector processing
    metadata: {
      type,
      source,
      timestamp: new Date().toISOString()
    }
  };
  
  vectorStore.set(id, newItem);
  saveVectorsToDisk();
  
  return newItem;
};

/**
 * Retrieves all stored vector items
 */
export const getAllVectors = (): VectorItem[] => {
  return Array.from(vectorStore.values());
};

/**
 * Gets vector items by type
 */
export const getVectorsByType = (type: string): VectorItem[] => {
  return Array.from(vectorStore.values())
    .filter(item => item.metadata.type === type);
};

/**
 * Deletes a vector item
 */
export const deleteVector = (id: string): boolean => {
  const deleted = vectorStore.delete(id);
  if (deleted) {
    saveVectorsToDisk();
  }
  return deleted;
};

/**
 * Performs maintenance on the vector database
 */
export const performVectorMaintenance = async (): Promise<number> => {
  try {
    saveVectorsToDisk();
    return vectorStore.size;
  } catch (error) {
    console.error('Error performing vector maintenance:', error);
    return 0;
  }
};

export default {
  storeVector,
  getAllVectors,
  getVectorsByType,
  deleteVector,
  performVectorMaintenance
};