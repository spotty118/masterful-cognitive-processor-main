/**
 * ThinkingModelFactory
 * Factory for creating and managing thinking models
 */
import { mcpConfig } from '../config/mcp-config.js';
/**
 * Factory class for creating and managing thinking models
 * Implements the Factory pattern for thinking model creation
 */
export class ThinkingModelFactory {
    models;
    /**
     * Constructor initializes the factory with available thinking models
     */
    constructor() {
        this.models = new Map();
        // Load models from configuration
        mcpConfig.core.thinkingModels.forEach(model => {
            this.models.set(model.name, model);
        });
    }
    /**
     * Gets a thinking model by name
     * @param modelName - The name of the model to retrieve
     * @returns The thinking model or undefined if not found
     * @complexity O(1) for map lookup
     * @throws Error if the model is not found
     */
    getModel(modelName) {
        const model = this.models.get(modelName);
        if (!model) {
            throw new Error(`Unknown thinking model: ${modelName}`);
        }
        return model;
    }
    /**
     * Gets all available thinking models
     * @returns Array of all thinking models
     * @complexity O(n) where n is the number of models
     */
    getAllModels() {
        return Array.from(this.models.values());
    }
    /**
     * Gets models filtered by complexity level
     * @param complexity - The complexity level to filter by
     * @returns Array of thinking models matching the complexity
     * @complexity O(n) where n is the number of models
     */
    getModelsByComplexity(complexity) {
        return Array.from(this.models.values()).filter(model => {
            // Map complexity levels
            const complexityMap = {
                'low': ['low'],
                'medium': ['low', 'medium'],
                'high': ['medium', 'high'],
                'very_high': ['high', 'very_high']
            };
            return complexityMap[complexity].includes(model.complexity || 'medium');
        });
    }
    /**
     * Gets models filtered by token limit
     * @param tokenLimit - The token limit to filter by
     * @returns Array of thinking models matching the token limit
     * @complexity O(n) where n is the number of models
     */
    getModelsByTokenLimit(tokenLimit) {
        return Array.from(this.models.values()).filter(model => model.tokenLimit === tokenLimit);
    }
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
    createCustomModel(name, description, tokenLimit, complexity, features) {
        // Ensure model name is unique
        if (this.models.has(name)) {
            throw new Error(`A thinking model with the name '${name}' already exists`);
        }
        const model = {
            name,
            description,
            tokenLimit,
            complexity,
            features
        };
        // Add to available models
        this.models.set(name, model);
        return model;
    }
}
// Export a singleton instance
export const thinkingModelFactory = new ThinkingModelFactory();
export default thinkingModelFactory;
//# sourceMappingURL=ThinkingModelFactory.js.map