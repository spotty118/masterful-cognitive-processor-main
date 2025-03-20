import { MCPConfig } from '../../models/types.js';
import { IReasoningStrategy } from '../../interfaces/IReasoningStrategy.js';
export declare class DefaultReasoningStrategySelector implements IReasoningStrategy {
    private config;
    constructor(config: MCPConfig);
    selectReasoningSystem(problem: string): Promise<{
        name: string;
        description: string;
        implementation: string;
    }>;
    /**
     * Dynamically selects a reasoning system based on problem characteristics and available systems.
     * @private
     */
    private dynamicallySelectReasoningSystem;
    /**
     * Determine the problem type based on its characteristics
     * Extracted from selectReasoningSystem for better modularity
     * @private
     */
    private determineProblemType;
}
