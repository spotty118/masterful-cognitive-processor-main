/**
 * Memory Service Implementation
 * Provides persistent storage and retrieval of memory items
 */
import { IMemoryService } from '../interfaces/IMemoryService.js';
import { MemoryItem } from '../models/types.js';
/**
 * Stores a new memory item
 */
export declare const storeMemory: (item: Omit<MemoryItem, "id">) => Promise<void>;
/**
 * Retrieves memory items based on a query using semantic vector search
 */
export declare const retrieveMemory: (query: string, limit?: number) => Promise<MemoryItem[]>;
/**
 * Gets a memory item by ID
 */
export declare const getMemoryById: (id: string) => Promise<MemoryItem | null>;
/**
 * Gets all memory items
 */
export declare const getAllMemoryItems: () => Promise<MemoryItem[]>;
/**
 * Gets memory items by type
 * @param type The type of memory items to retrieve
 * @returns Array of memory items of the specified type
 */
export declare const getMemoryItemsByType: (type: MemoryItem["type"]) => Promise<MemoryItem[]>;
/**
 * Updates connections between memory items
 */
export declare const updateMemoryConnections: (itemId: string, connections: string[]) => Promise<void>;
/**
 * Gets connected memory items
 */
export declare const getConnectedMemories: (itemId: string) => Promise<MemoryItem[]>;
/**
 * Gets memory statistics
 */
export declare const getMemoryStats: () => Promise<{
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
 */
export declare const performMemoryMaintenance: () => Promise<number>;
declare const _default: IMemoryService;
export default _default;
