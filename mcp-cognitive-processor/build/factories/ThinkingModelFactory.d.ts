/**
 * ThinkingModelFactory
 * Factory for creating and managing thinking models
 */
import { ThinkingModel } from '../models/types.js';
/**
 * Factory class for creating and managing thinking models
 * Implements the Factory pattern for thinking model creation
 */
export declare class ThinkingModelFactory {
    private models;
    /**
     * Constructor initializes the factory with available thinking models
     */
    constructor();
    /**
     * Gets a thinking model by name
     * @param modelName - The name of the model to retrieve
     * @returns The thinking model or undefined if not found
     * @complexity O(1) for map lookup
     * @throws Error if the model is not found
     */
    getModel(modelName: string): ThinkingModel;
    /**
     * Gets all available thinking models
     * @returns Array of all thinking models
     * @complexity O(n) where n is the number of models
     */
    getAllModels(): ThinkingModel[];
    /**
     * Gets models filtered by complexity level
     * @param complexity - The complexity level to filter by
     * @returns Array of thinking models matching the complexity
     * @complexity O(n) where n is the number of models
     */
    getModelsByComplexity(complexity: 'low' | 'medium' | 'high' | 'very_high'): ThinkingModel[];
    /**
     * Gets models filtered by token limit
     * @param tokenLimit - The token limit to filter by
     * @returns Array of thinking models matching the token limit
     * @complexity O(n) where n is the number of models
     */
    getModelsByTokenLimit(tokenLimit: 'very_low' | 'moderate' | 'high' | 'very_high'): ThinkingModel[];
    /**
     * Creates a custom thinking model
     * @param name - The name of the custom model
     * @param description - The description of the model
     * @param tokenLimit - The token limit of the model
     * @param complexity - The complexity level of the model
     * @param features - Optional features of the model
     * @returns The created thinking model
     * @complexity O(1) for model creation
     */
    createCustomModel(name: string, description: string, tokenLimit: 'very_low' | 'moderate' | 'high' | 'very_high', complexity: 'low' | 'medium' | 'high' | 'very_high', features?: string[]): ThinkingModel;
}
export declare const thinkingModelFactory: ThinkingModelFactory;
export default thinkingModelFactory;
