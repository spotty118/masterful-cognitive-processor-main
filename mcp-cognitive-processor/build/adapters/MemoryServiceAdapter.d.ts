/**
 * Memory Service Adapter
 * Adapts the memory service implementation to the IMemoryService interface
 * @complexity O(1) for initialization
 */
import { IMemoryService } from '../interfaces/IMemoryService.js';
import { MemoryItem } from '../models/types.js';
/**
 * Adapter for the Memory Service
 * Implements the IMemoryService interface and delegates to the actual implementation
 */
export declare class MemoryServiceAdapter implements IMemoryService {
    /**
     * Stores a memory item
     * @param memory - The memory item to store
     * @returns Promise that resolves when the memory is stored
     * @complexity O(1) for storage operation
     */
    storeMemory(memory: Omit<MemoryItem, 'id'>): Promise<void>;
    /**
     * Retrieves memory items based on a query
     * @param query - The query to search for
     * @param limit - Maximum number of items to retrieve (optional)
     * @returns Array of memory results with relevance scores
     * @complexity O(n) where n is the number of memory items
     */
    retrieveMemory(query: string, limit?: number): Promise<MemoryItem[]>;
    /**
     * Gets all memory items
     * @returns Array of all memory items
     * @complexity O(1) for direct retrieval
     */
    getAllMemoryItems(): Promise<MemoryItem[]>;
    /**
     * Updates connections between memory items
     * @param itemId - The ID of the item to update
     * @param connections - Array of connected item IDs
     * @complexity O(1) for update operation
     */
    updateMemoryConnections(itemId: string, connections: string[]): Promise<void>;
    /**
     * Gets connected memory items
     * @param itemId - The ID of the item to get connections for
     * @returns Array of connected memory items
     * @complexity O(n) where n is the number of memory items
     */
    getConnectedMemories(itemId: string): Promise<MemoryItem[]>;
    /**
     * Gets memory items by type
     * @param type - The type of memory items to retrieve
     * @returns Array of memory items of the specified type
     * @complexity O(n) where n is the number of memory items
     */
    getMemoryItemsByType(type: MemoryItem['type']): Promise<MemoryItem[]>;
    /**
     * Gets memory statistics
     * @returns Memory system statistics
     * @complexity O(n) where n is the number of memory items
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
     * @returns Number of items processed
     * @complexity O(n) where n is the number of memory items
     */
    performMemoryMaintenance(): Promise<number>;
    /**
     * Connects two memory items
     * @param sourceId - The ID of the source memory item
     * @param targetId - The ID of the target memory item
     * @returns Promise that resolves when the connection is created
     * @complexity O(1) for connection operation
     */
    connectMemories(sourceId: string, targetId: string): Promise<void>;
    /**
     * Retrieves a specific memory item by ID
     * @param id - The ID of the memory item to retrieve
     * @returns The memory item or null if not found
     * @complexity O(1) for direct lookup
     */
    getMemoryById(id: string): Promise<MemoryItem | null>;
}
