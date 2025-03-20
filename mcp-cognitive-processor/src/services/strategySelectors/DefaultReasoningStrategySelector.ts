import { MCPConfig } from '../../models/types.js';
import { IReasoningStrategy } from '../../interfaces/IReasoningStrategy.js';
// Remove ThinkingEngine import to prevent circular dependency

export class DefaultReasoningStrategySelector implements IReasoningStrategy {
  private config: MCPConfig;

  constructor(config: MCPConfig) {
    this.config = config;
  }

  public async selectReasoningSystem(problem: string): Promise<{
    name: string;
    description: string;
    implementation: string;
  }> {
    return this.dynamicallySelectReasoningSystem(problem);
  }

  /**
   * Dynamically selects a reasoning system based on problem characteristics and available systems.
   * @private
   */
  private async dynamicallySelectReasoningSystem(problem: string): Promise<{
    name: string;
    description: string;
    implementation: string;
  }> {
    const reasoningSystems = this.config.core.intelligence.reasoningSystems;
    const problemType = await this.determineProblemType(problem);

    // Prioritize reasoning systems based on problem type and system descriptions
    switch (problemType) {
      case 'multiple_aspects':
        // For problems with multiple aspects, prefer tree-of-thoughts if available
        const treeOfThoughts = reasoningSystems.find((rs: { name: string; description: string; implementation: string; }) => rs.name === 'tree_of_thoughts');
        if (treeOfThoughts) return treeOfThoughts;
        break;
      case 'sequential':
        // For sequential problems, prefer chain-of-thought
        const chainOfThought = reasoningSystems.find(rs => rs.name === 'chain_of_thought');
        if (chainOfThought) return chainOfThought;
        break;
      // Add more cases for other problem types as needed
      default:
        // For general problems, default to chain-of-thought or the first available system
        const defaultSystem = reasoningSystems.find((rs: { name: string; description: string; implementation: string; }) => rs.name === 'chain_of_thought') || reasoningSystems[0];
        if (defaultSystem) return defaultSystem;
    }

    // Fallback to a default reasoning system if none selected
    return {
      name: 'chain_of_thought', // Default reasoning system
      description: 'Default sequential reasoning system',
      implementation: 'chain_of_thought_strategy'
    };
  }

  /**
   * Determine the problem type based on its characteristics
   * Extracted from selectReasoningSystem for better modularity
   * @private
   */
  private async determineProblemType(problem: string): Promise<string> {
    // Placeholder implementation - will be moved from ThinkingEngine
    return 'general'; // Default to general for now
  }
}