// Remove ThinkingEngine import to prevent circular dependency
export class DefaultReasoningStrategySelector {
    config;
    constructor(config) {
        this.config = config;
    }
    async selectReasoningSystem(problem) {
        return this.dynamicallySelectReasoningSystem(problem);
    }
    /**
     * Dynamically selects a reasoning system based on problem characteristics and available systems.
     * @private
     */
    async dynamicallySelectReasoningSystem(problem) {
        const reasoningSystems = this.config.core.intelligence.reasoningSystems;
        const problemType = await this.determineProblemType(problem);
        // Prioritize reasoning systems based on problem type and system descriptions
        switch (problemType) {
            case 'multiple_aspects':
                // For problems with multiple aspects, prefer tree-of-thoughts if available
                const treeOfThoughts = reasoningSystems.find((rs) => rs.name === 'tree_of_thoughts');
                if (treeOfThoughts)
                    return treeOfThoughts;
                break;
            case 'sequential':
                // For sequential problems, prefer chain-of-thought
                const chainOfThought = reasoningSystems.find(rs => rs.name === 'chain_of_thought');
                if (chainOfThought)
                    return chainOfThought;
                break;
            // Add more cases for other problem types as needed
            default:
                // For general problems, default to chain-of-thought or the first available system
                const defaultSystem = reasoningSystems.find((rs) => rs.name === 'chain_of_thought') || reasoningSystems[0];
                if (defaultSystem)
                    return defaultSystem;
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
    async determineProblemType(problem) {
        // Placeholder implementation - will be moved from ThinkingEngine
        return 'general'; // Default to general for now
    }
}
//# sourceMappingURL=DefaultReasoningStrategySelector.js.map