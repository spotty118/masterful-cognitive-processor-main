import { IReasoningStrategy } from '../../interfaces/IReasoningStrategy.js';
import { MCPConfig } from '../../models/types.js';
export declare class AdvancedStrategySelector implements IReasoningStrategy {
    private config;
    private resourceConstraints;
    constructor(config: MCPConfig);
    /**
     * Select the most appropriate reasoning system based on problem characteristics,
     * context relevance, and available resources
     */
    selectReasoningSystem(problem: string): Promise<{
        name: string;
        description: string;
        implementation: string;
    }>;
    /**
     * Analyze problem complexity based on various factors
     * @param problem The problem description
     * @returns Problem complexity level
     */
    private analyzeProblemComplexity;
    /**
     * Identify the primary domain of the problem
     * @param problem The problem description
     * @returns Identified problem domain
     */
    private identifyProblemDomain;
    /**
     * Extract relevant features from the problem
     * @param problem The problem description
     * @returns List of identified features
     */
    private extractProblemFeatures;
    /**
     * Score strategies based on problem analysis and resource constraints
     */
    private scoreStrategies;
}
