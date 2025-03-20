/**
 * Vector Service
 * Provides vector processing capabilities to enhance Roo's functionality
 */
import { VectorItem } from '../models/types.js';
/**
 * Stores a vector item in the database
 */
export declare const storeVector: (content: string, type: string, source: string) => Promise<VectorItem>;
/**
 * Retrieves all stored vector items
 */
export declare const getAllVectors: () => VectorItem[];
/**
 * Gets vector items by type
 */
export declare const getVectorsByType: (type: string) => VectorItem[];
/**
 * Deletes a vector item
 */
export declare const deleteVector: (id: string) => boolean;
/**
 * Performs maintenance on the vector database
 */
export declare const performVectorMaintenance: () => Promise<number>;
declare const _default: {
    storeVector: (content: string, type: string, source: string) => Promise<VectorItem>;
    getAllVectors: () => VectorItem[];
    getVectorsByType: (type: string) => VectorItem[];
    deleteVector: (id: string) => boolean;
    performVectorMaintenance: () => Promise<number>;
};
export default _default;
