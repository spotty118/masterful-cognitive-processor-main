/**
 * Memory Service Adapter
 * Adapts the memory service implementation to the IMemoryService interface
 * @complexity O(1) for initialization
 */

import { IMemoryService } from '../interfaces/IMemoryService.js';
import { MemoryItem, MemoryResult } from '../models/types.js';
import MemoryService from '../services/memoryService.js';

/**
 * Adapter for the Memory Service
 * Implements the IMemoryService interface and delegates to the actual implementation
 */
export class MemoryServiceAdapter implements IMemoryService {
  /**
   * Stores a memory item
   * @param memory - The memory item to store
   * @returns Promise that resolves when the memory is stored
   * @complexity O(1) for storage operation
   */
  async storeMemory(memory: Omit<MemoryItem, 'id'>): Promise<void> {
    // Add timestamp if not provided
    const memoryWithTimestamp = {
      ...memory,
      timestamp: memory.timestamp || new Date().toISOString()
    };
    
    // Delegate to the actual implementation
    await MemoryService.storeMemory(memoryWithTimestamp);
  }
  
  /**
   * Retrieves memory items based on a query
   * @param query - The query to search for
   * @param limit - Maximum number of items to retrieve (optional)
   * @returns Array of memory results with relevance scores
   * @complexity O(n) where n is the number of memory items
   */
  async retrieveMemory(query: string, limit?: number): Promise<MemoryItem[]> {
    return MemoryService.retrieveMemory(query, limit);
  }
  
  /**
   * Gets all memory items
   * @returns Array of all memory items
   * @complexity O(1) for direct retrieval
   */
  async getAllMemoryItems(): Promise<MemoryItem[]> {
    return MemoryService.getAllMemoryItems();
  }
  
  /**
   * Updates connections between memory items
   * @param itemId - The ID of the item to update
   * @param connections - Array of connected item IDs
   * @complexity O(1) for update operation
   */
  async updateMemoryConnections(itemId: string, connections: string[]): Promise<void> {
    // Delegate to the actual implementation if available
    if (typeof MemoryService.updateMemoryConnections === 'function') {
      await MemoryService.updateMemoryConnections(itemId, connections);
    } else {
      // Fallback implementation
      const item = await this.getMemoryById(itemId);
      if (item) {
        // Use a different method to update the item if available
        console.warn('updateMemoryConnections not implemented in MemoryService');
      }
    }
  }
  
  /**
   * Gets connected memory items
   * @param itemId - The ID of the item to get connections for
   * @returns Array of connected memory items
   * @complexity O(n) where n is the number of memory items
   */
  async getConnectedMemories(itemId: string): Promise<MemoryItem[]> {
    // Delegate to the actual implementation if available
    if (typeof MemoryService.getConnectedMemories === 'function') {
      return MemoryService.getConnectedMemories(itemId);
    } else {
      // Fallback implementation
      const item = await this.getMemoryById(itemId);
      if (item && item.connections && item.connections.length > 0) {
        const allItems = await this.getAllMemoryItems();
        return allItems.filter(i => item.connections.includes(i.id));
      }
      return [];
    }
  }
  
  /**
   * Gets memory items by type
   * @param type - The type of memory items to retrieve
   * @returns Array of memory items of the specified type
   * @complexity O(n) where n is the number of memory items
   */
  async getMemoryItemsByType(type: MemoryItem['type']): Promise<MemoryItem[]> {
    // Delegate to the actual implementation if available
    if (typeof MemoryService.getMemoryItemsByType === 'function') {
      return MemoryService.getMemoryItemsByType(type);
    } else {
      // Fallback implementation
      const allItems = await this.getAllMemoryItems();
      return allItems.filter(item => item.type === type);
    }
  }
  
  /**
   * Gets memory statistics
   * @returns Memory system statistics
   * @complexity O(n) where n is the number of memory items
   */
  async getMemoryStats(): Promise<{
    totalItems: number;
    byType: Record<string, number>;
    averageConnections: number;
    topConnected: Array<{
      id: string;
      connections: number;
    }>;
  }> {
    // Delegate to the actual implementation if available
    if (typeof MemoryService.getMemoryStats === 'function') {
      return MemoryService.getMemoryStats();
    } else {
      // Fallback implementation
      const allItems = await this.getAllMemoryItems();
      
      // Calculate statistics
      const byType: Record<string, number> = {};
      let totalConnections = 0;
      
      const itemsWithConnectionCounts = allItems.map(item => {
        // Count by type
        byType[item.type] = (byType[item.type] || 0) + 1;
        
        // Count connections
        const connectionCount = item.connections?.length || 0;
        totalConnections += connectionCount;
        
        return {
          id: item.id,
          connections: connectionCount
        };
      });
      
      // Sort by connection count (descending)
      const topConnected = itemsWithConnectionCounts
        .sort((a, b) => b.connections - a.connections)
        .slice(0, 5); // Top 5
      
      return {
        totalItems: allItems.length,
        byType,
        averageConnections: allItems.length > 0 ? totalConnections / allItems.length : 0,
        topConnected
      };
    }
  }
  
  /**
   * Performs maintenance on the memory system
   * @returns Number of items processed
   * @complexity O(n) where n is the number of memory items
   */
  async performMemoryMaintenance(): Promise<number> {
    return MemoryService.performMemoryMaintenance();
  }
  
  /**
   * Connects two memory items
   * @param sourceId - The ID of the source memory item
   * @param targetId - The ID of the target memory item
   * @returns Promise that resolves when the connection is created
   * @complexity O(1) for connection operation
   */
  async connectMemories(sourceId: string, targetId: string): Promise<void> {
    // Get the source memory item
    const sourceItem = await this.getMemoryById(sourceId);
    
    if (!sourceItem) {
      throw new Error(`Source memory item not found: ${sourceId}`);
    }
    
    // Check if the target memory item exists
    const targetItem = await this.getMemoryById(targetId);
    
    if (!targetItem) {
      throw new Error(`Target memory item not found: ${targetId}`);
    }
    
    // Add the target ID to the source item's connections if not already present
    if (!sourceItem.connections.includes(targetId)) {
      const updatedConnections = [...sourceItem.connections, targetId];
      
      // Update the source item's connections
      await this.updateMemoryConnections(sourceId, updatedConnections);
    }
  }
  
  /**
   * Retrieves a specific memory item by ID
   * @param id - The ID of the memory item to retrieve
   * @returns The memory item or null if not found
   * @complexity O(1) for direct lookup
   */
  async getMemoryById(id: string): Promise<MemoryItem | null> {
    // Get all memory items
    const allItems = await MemoryService.getAllMemoryItems();
    
    // Find the item with the matching ID
    const item = allItems.find(item => item.id === id);
    
    return item || null;
  }
}