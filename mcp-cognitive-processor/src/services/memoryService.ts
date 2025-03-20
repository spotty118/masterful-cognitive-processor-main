/**
 * Memory Service Implementation
 * Provides persistent storage and retrieval of memory items
 */

import { IMemoryService } from '../interfaces/IMemoryService.js';
import { MemoryItem, MemoryVector } from '../models/types.js';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

// Define the database file path - ensure relative paths are resolved properly
const DB_DIR = process.env.MCP_DB_DIR || path.join(process.cwd(), 'data');
const MEMORY_FILE = path.join(DB_DIR, 'memory.json');
const MEMORY_DIR = path.join(DB_DIR, 'memory');
const VECTOR_DIR = path.join(DB_DIR, 'vectors');

// Memory cache
let memoryItems: Map<string, MemoryItem> = new Map();
// Memory vector storage
let memoryVectors: Map<string, MemoryVector> = new Map();
let isInitialized = false;

// Ensure all required directories exist with proper error handling
const ensureDirectories = async (): Promise<void> => {
  try {
    // Use recursive option to create parent directories if they don't exist
    await fs.promises.mkdir(DB_DIR, { recursive: true });
    await fs.promises.mkdir(MEMORY_DIR, { recursive: true });
    await fs.promises.mkdir(VECTOR_DIR, { recursive: true });
    
    // Verify directories were created successfully
    await Promise.all([
      fs.promises.access(DB_DIR, fs.constants.W_OK),
      fs.promises.access(MEMORY_DIR, fs.constants.W_OK),
      fs.promises.access(VECTOR_DIR, fs.constants.W_OK)
    ]);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create/verify required directories: ${error.message}`);
    } else {
      throw new Error(`Failed to create/verify required directories: ${String(error)}`);
    }
  }
};

// Initialize directories immediately and handle any errors
ensureDirectories().catch(error => {
  console.error('Failed to initialize memory service directories:', error);
});

/**
 * Initializes the memory system
 */
const initializeMemory = async (): Promise<void> => {
  if (isInitialized) return;
  
  try {
    // Load existing memory items - in parallel
    const loadPromises: Promise<void>[] = [];
    
    // Load main memory file
    if (fs.existsSync(MEMORY_FILE)) {
      loadPromises.push((async () => {
        const data = await fs.promises.readFile(MEMORY_FILE, 'utf8');
        const items: MemoryItem[] = JSON.parse(data);
        memoryItems = new Map(items.map(item => [item.id, item]));
      })());
    } else {
      loadPromises.push(saveMemoryToDisk());
    }
    
    // Load vector embeddings if they exist
    if (fs.existsSync(path.join(VECTOR_DIR, 'vectors.json'))) {
      loadPromises.push((async () => {
        const data = await fs.promises.readFile(path.join(VECTOR_DIR, 'vectors.json'), 'utf8');
        const vectors: MemoryVector[] = JSON.parse(data);
        memoryVectors = new Map(vectors.map(vector => [vector.itemId, vector]));
      })());
    }
    
    // Wait for all loading to complete
    await Promise.all(loadPromises);
    
    // Create vector embeddings for items without them
    await ensureVectorEmbeddings();
    
    isInitialized = true;
  } catch (error) {
    console.error('Error initializing memory:', error);
    memoryItems = new Map();
    memoryVectors = new Map();
    await saveMemoryToDisk();
    isInitialized = true;
  }
};

/**
 * Ensures all memory items have vector embeddings
 */
const ensureVectorEmbeddings = async (): Promise<void> => {
  // Identify items without vectors
  const itemsWithoutVectors = Array.from(memoryItems.values())
    .filter(item => !memoryVectors.has(item.id));
  
  if (itemsWithoutVectors.length === 0) return;
  
  console.log(`Generating vector embeddings for ${itemsWithoutVectors.length} memory items`);
  
  // Create simple vector embeddings for items
  // In a real implementation, this would use a proper embedding model
  for (const item of itemsWithoutVectors) {
    const vector = createSimpleEmbedding(item.content);
    const memoryVector: MemoryVector = {
      itemId: item.id,
      vector,
      created: new Date().toISOString()
    };
    
    memoryVectors.set(item.id, memoryVector);
    
    // Also save individual vector file for better concurrency
    const vectorFile = path.join(VECTOR_DIR, `${item.id}.json`);
    await fs.promises.writeFile(vectorFile, JSON.stringify(memoryVector, null, 2));
  }
  
  // Save all vectors
  await saveVectorsToDisk();
};

/**
 * Saves memory items to disk
 */
const saveMemoryToDisk = async (): Promise<void> => {
  try {
    // Ensure directory exists before writing
    if (!fs.existsSync(path.dirname(MEMORY_FILE))) {
      fs.mkdirSync(path.dirname(MEMORY_FILE), { recursive: true });
    }
    const items = Array.from(memoryItems.values());
    await fs.promises.writeFile(MEMORY_FILE, JSON.stringify(items, null, 2));
  } catch (error) {
    console.error('Error saving memory:', error);
  }
};

/**
 * Saves vector embeddings to disk
 */
const saveVectorsToDisk = async (): Promise<void> => {
  try {
    // Ensure directory exists
    if (!fs.existsSync(VECTOR_DIR)) {
      fs.mkdirSync(VECTOR_DIR, { recursive: true });
    }
    
    const vectors = Array.from(memoryVectors.values());
    await fs.promises.writeFile(
      path.join(VECTOR_DIR, 'vectors.json'),
      JSON.stringify(vectors, null, 2)
    );
  } catch (error) {
    console.error('Error saving vectors:', error);
  }
};

/**
 * Creates a simple vector embedding for text
 * This is a placeholder for a proper embedding model
 */
const createSimpleEmbedding = (text: string, dimensions: number = 128): number[] => {
  const normalized = text.toLowerCase().trim();
  // Hash the text to create a consistent but unique pattern
  const hash = createHash('sha256').update(normalized).digest('hex');
  
  // Use the hash to seed a vector
  const vector: number[] = [];
  for (let i = 0; i < dimensions; i++) {
    // Use characters from the hash to generate vector values
    const hashPos = i % (hash.length - 1);
    const value = parseInt(hash.substring(hashPos, hashPos + 2), 16) / 255; // Normalize to 0-1
    vector.push(value);
  }
  
  return normalizeVector(vector);
};

/**
 * Normalizes a vector to unit length
 */
const normalizeVector = (vector: number[]): number[] => {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector.map(() => 0);
  return vector.map(val => val / magnitude);
};

/**
 * Calculates cosine similarity between two vectors
 */
const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) throw new Error('Vectors must have the same dimensions');
  
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
};

/**
 * Stores a new memory item
 */
export const storeMemory = async (item: Omit<MemoryItem, 'id'>): Promise<void> => {
  await initializeMemory();
  
  const newItem: MemoryItem = {
    ...item,
    id: uuidv4(),
    timestamp: new Date().toISOString()
  };
  
  memoryItems.set(newItem.id, newItem);
  await saveMemoryToDisk();
  
  // Also store individual file for better concurrency
  const itemFile = path.join(MEMORY_DIR, `${newItem.id}.json`);
  await fs.promises.writeFile(itemFile, JSON.stringify(newItem, null, 2));
  
  // Create and store vector embedding
  const vector = createSimpleEmbedding(newItem.content);
  await saveMemoryVector(newItem.id, vector);
};

/**
 * Saves a memory vector
 */
const saveMemoryVector = async (itemId: string, vector: number[]): Promise<void> => {
  const memoryVector: MemoryVector = {
    itemId,
    vector,
    created: new Date().toISOString()
  };
  
  memoryVectors.set(itemId, memoryVector);
  
  // Save individual vector file
  const vectorFile = path.join(VECTOR_DIR, `${itemId}.json`);
  await fs.promises.writeFile(vectorFile, JSON.stringify(memoryVector, null, 2));
  
  // Update vectors.json occasionally (not on every write for performance)
  if (Math.random() < 0.1) { // 10% chance to update the main file
    await saveVectorsToDisk();
  }
};

/**
 * Retrieves memory items based on a query using semantic vector search
 */
export const retrieveMemory = async (
  query: string,
  limit: number = 10
): Promise<MemoryItem[]> => {
  await initializeMemory();
  
  if (!query) {
    // Return most recent items if no query
    return Array.from(memoryItems.values())
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  }
  
  // Create query vector
  const queryVector = createSimpleEmbedding(query);
  
  // Calculate both vector and text-based similarity for hybrid search
  const items = Array.from(memoryItems.values());
  const results = await Promise.all(items.map(async item => {
    // Get item vector or create if missing
    let vector = memoryVectors.get(item.id)?.vector;
    if (!vector) {
      vector = createSimpleEmbedding(item.content);
      await saveMemoryVector(item.id, vector);
    }
    
    // Calculate vector similarity (semantic search)
    const vectorSimilarity = cosineSimilarity(queryVector, vector);
    
    // Also calculate text similarity for hybrid approach
    const textSimilarity = calculateTextRelevance(query, item);
    
    // Combine scores with appropriate weights
    // Semantic similarity is generally more meaningful
    const combinedScore = vectorSimilarity * 0.7 + textSimilarity * 0.3;
    
    return {
      item,
      relevance: combinedScore
    };
  }));
  
  return results
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit)
    .map(result => result.item);
};

/**
 * Gets a memory item by ID
 */
export const getMemoryById = async (id: string): Promise<MemoryItem | null> => {
  await initializeMemory();
  return memoryItems.get(id) || null;
};

/**
 * Gets all memory items
 */
export const getAllMemoryItems = async (): Promise<MemoryItem[]> => {
  await initializeMemory();
  return Array.from(memoryItems.values());
};

/**
 * Gets memory items by type
 * @param type The type of memory items to retrieve
 * @returns Array of memory items of the specified type
 */
export const getMemoryItemsByType = async (type: MemoryItem['type']): Promise<MemoryItem[]> => {
  await initializeMemory();
  return Array.from(memoryItems.values()).filter(item => item.type === type);
};

/**
 * Updates connections between memory items
 */
export const updateMemoryConnections = async (
  itemId: string,
  connections: string[]
): Promise<void> => {
  await initializeMemory();
  
  const item = memoryItems.get(itemId);
  if (!item) {
    throw new Error(`Memory item not found: ${itemId}`);
  }
  
  item.connections = connections;
  memoryItems.set(itemId, item);
  
  // Update individual file
  const itemFile = path.join(MEMORY_DIR, `${itemId}.json`);
  await fs.promises.writeFile(itemFile, JSON.stringify(item, null, 2));
  
  await saveMemoryToDisk();
};

/**
 * Gets connected memory items
 */
export const getConnectedMemories = async (itemId: string): Promise<MemoryItem[]> => {
  await initializeMemory();
  
  const item = memoryItems.get(itemId);
  if (!item) {
    return [];
  }
  
  return item.connections
    .map(id => memoryItems.get(id))
    .filter((item): item is MemoryItem => item !== undefined);
};

/**
 * Gets memory statistics
 */
export const getMemoryStats = async (): Promise<{
  totalItems: number;
  byType: Record<string, number>;
  averageConnections: number;
  topConnected: Array<{
    id: string;
    connections: number;
  }>;
}> => {
  await initializeMemory();
  
  const items = Array.from(memoryItems.values());
  const byType: Record<string, number> = {};
  let totalConnections = 0;
  
  items.forEach(item => {
    byType[item.type] = (byType[item.type] || 0) + 1;
    totalConnections += item.connections.length;
  });
  
  const topConnected = items
    .map(item => ({
      id: item.id,
      connections: item.connections.length
    }))
    .sort((a, b) => b.connections - a.connections)
    .slice(0, 10);
  
  return {
    totalItems: items.length,
    byType,
    averageConnections: items.length > 0 ? totalConnections / items.length : 0,
    topConnected
  };
};

/**
 * Performs maintenance on the memory system
 */
export const performMemoryMaintenance = async (): Promise<number> => {
  await initializeMemory();
  let cleanedItems = 0;
  
  try {
    // Clean up orphaned connections
    const validIds = new Set(memoryItems.keys());
    
    // Convert the Map values iterator to an array to avoid downlevelIteration issues
    const itemsArray = Array.from(memoryItems.values());
    for (const item of itemsArray) {
      const originalConnections = item.connections.length;
      item.connections = item.connections.filter(id => validIds.has(id));
      
      if (item.connections.length !== originalConnections) {
        cleanedItems++;
        const itemFile = path.join(MEMORY_DIR, `${item.id}.json`);
        await fs.promises.writeFile(itemFile, JSON.stringify(item, null, 2));
      }
    }
    
    // Clean up old individual files
    const files = await fs.promises.readdir(MEMORY_DIR);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const id = file.replace('.json', '');
      if (!memoryItems.has(id)) {
        await fs.promises.unlink(path.join(MEMORY_DIR, file));
        cleanedItems++;
      }
    }
    
    // Clean up orphaned vector files
    const vectorFiles = await fs.promises.readdir(VECTOR_DIR);
    for (const file of vectorFiles) {
      if (!file.endsWith('.json') || file === 'vectors.json') continue;
      
      const id = file.replace('.json', '');
      if (!memoryItems.has(id)) {
        await fs.promises.unlink(path.join(VECTOR_DIR, file));
        cleanedItems++;
      }
    }
    
    await saveMemoryToDisk();
    await saveVectorsToDisk();
    return cleanedItems;
  } catch (error) {
    console.error('Error performing memory maintenance:', error);
    return 0;
  }
};

/**
 * Calculates text-based relevance score between query and memory item
 * This uses traditional text similarity rather than vectors
 */
const calculateTextRelevance = (query: string, item: MemoryItem): number => {
  const queryWords = query.toLowerCase().split(/\s+/);
  const contentWords = item.content.toLowerCase().split(/\s+/);
  
  // Calculate word overlap
  const querySet = new Set(queryWords);
  const contentSet = new Set(contentWords);
  // Use Array.from instead of spread operator to avoid downlevelIteration issues
  const intersection = new Set(Array.from(querySet).filter(x => contentSet.has(x)));
  
  // Create union without spread operator
  const union = new Set();
  Array.from(querySet).forEach(item => union.add(item));
  Array.from(contentSet).forEach(item => union.add(item));
  
  // Jaccard similarity
  const similarity = intersection.size / union.size;
  
  // Boost by importance and recency
  const importanceBoost = item.importance || 0.5;
  const age = Date.now() - new Date(item.timestamp).getTime();
  const recencyBoost = Math.max(0.1, 1 - (age / (30 * 24 * 60 * 60 * 1000))); // Decay over 30 days
  
  // Create contextual boost based on memory type
  const typeBoost = (() => {
    switch (item.type) {
      case 'episodic': return 1.0; // Recent experiences are valuable
      case 'semantic': return 1.2; // General knowledge is usually more relevant
      case 'procedural': return 0.8; // Procedural memories vary in relevance
      case 'working': return 1.5; // Working memory is most relevant for current task
      default: return 1.0;
    }
  })();
  
  return similarity * importanceBoost * recencyBoost * typeBoost;
};

export default {
  storeMemory,
  retrieveMemory,
  getMemoryById,
  getAllMemoryItems,
  updateMemoryConnections,
  getConnectedMemories,
  getMemoryStats,
  performMemoryMaintenance,
  getMemoryItemsByType
} as IMemoryService;