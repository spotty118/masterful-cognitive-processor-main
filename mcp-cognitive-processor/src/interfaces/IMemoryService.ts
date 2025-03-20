/**
 * Interface for memory operations
 * Defines methods for storing and retrieving memory items
 */

import { MemoryItem, MemoryResult } from '../models/types.js';

export interface IMemoryService {
  /**
   * Stores a new memory item
   * @param item - The memory item to store
   */
  storeMemory(item: Omit<MemoryItem, 'id'>): Promise<void>;

  /**
   * Retrieves memory items based on a query
   * @param query - The query to search for
   * @param limit - Maximum number of items to retrieve
   * @returns Array of memory items
   */
  retrieveMemory(query: string, limit?: number): Promise<MemoryItem[]>;

  /**
   * Gets a memory item by ID
   * @param id - The ID of the memory item
   * @returns The memory item or null if not found
   */
  getMemoryById(id: string): Promise<MemoryItem | null>;

  /**
   * Gets all memory items
   * @returns Array of all memory items
   */
  getAllMemoryItems(): Promise<MemoryItem[]>;

  /**
   * Updates connections between memory items
   * @param itemId - The ID of the item to update
   * @param connections - Array of connected item IDs
   */
  updateMemoryConnections(itemId: string, connections: string[]): Promise<void>;

  /**
   * Gets connected memory items
   * @param itemId - The ID of the item to get connections for
   * @returns Array of connected memory items
   */
  getConnectedMemories(itemId: string): Promise<MemoryItem[]>;

  /**
   * Gets memory items by type
   * @param type The type of memory items to retrieve
   * @returns Array of memory items of the specified type
   */
  getMemoryItemsByType(type: MemoryItem['type']): Promise<MemoryItem[]>;

  /**
   * Gets memory statistics
   * @returns Memory system statistics
   */
  getMemoryStats(): Promise<{
    totalItems: number;
    byType: Record<string, number>;
    averageConnections: number;
    topConnected: Array<{
      id: string;
      connections: number;
    }>;
  }>;

  /**
   * Performs maintenance on the memory system
   * @returns Number of items cleaned up
   */
  performMemoryMaintenance(): Promise<number>;
}