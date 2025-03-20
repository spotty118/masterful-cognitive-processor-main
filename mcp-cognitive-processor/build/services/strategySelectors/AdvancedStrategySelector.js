// Define problem complexity levels
var ProblemComplexity;
(function (ProblemComplexity) {
    ProblemComplexity["Low"] = "low";
    ProblemComplexity["Medium"] = "medium";
    ProblemComplexity["High"] = "high";
    ProblemComplexity["VeryHigh"] = "very_high";
})(ProblemComplexity || (ProblemComplexity = {}));
// Define problem domains for context relevance
var ProblemDomain;
(function (ProblemDomain) {
    ProblemDomain["Mathematical"] = "mathematical";
    ProblemDomain["Logical"] = "logical";
    ProblemDomain["Creative"] = "creative";
    ProblemDomain["Scientific"] = "scientific";
    ProblemDomain["Engineering"] = "engineering";
    ProblemDomain["Linguistic"] = "linguistic";
    ProblemDomain["Medical"] = "medical";
    ProblemDomain["Business"] = "business";
    ProblemDomain["General"] = "general";
})(ProblemDomain || (ProblemDomain = {}));
export class AdvancedStrategySelector {
    config;
    resourceConstraints;
    constructor(config) {
        this.config = config;
        // Initialize resource constraints (could be loaded from config)
        // Using default values since these properties might not be defined in the current config
        this.resourceConstraints = {
            maxTokens: 8192, // Default token limit
            maxTime: 60000, // Default execution time limit in ms
            parallelCapacity: 2, // Default parallel execution capacity
        };
        // Try to load from config if available - using proper MCPConfig structure
        try {
            // Check if we have processing limits in the config
            if (config.maxSteps !== undefined) {
                this.resourceConstraints.parallelCapacity = Math.min(2, Number(config.maxSteps) / 2);
            }
            if (config.tokenBudget !== undefined) {
                this.resourceConstraints.maxTokens = Number(config.tokenBudget);
            }
            // Check for relevant model tokens limits in the thinkingModels
            const defaultModel = config.defaultModel || config.core?.thinkingModels?.[0];
            if (defaultModel?.maxTokens !== undefined) {
                this.resourceConstraints.maxTokens = Math.min(this.resourceConstraints.maxTokens, Number(defaultModel.maxTokens));
            }
        }
        catch (error) {
            console.warn('Error loading resource constraints from config:', error);
        }
    }
    /**
     * Select the most appropriate reasoning system based on problem characteristics,
     * context relevance, and available resources
     */
    async selectReasoningSystem(problem) {
        const availableStrategies = this.config.core.intelligence.reasoningSystems || [];
        if (availableStrategies.length === 0) {
            console.warn('No reasoning strategies available, returning default enhanced strategy');
            return {
                name: 'enhanced',
                description: 'Enhanced reasoning strategy (default)',
                implementation: 'enhanced_thinking_strategy',
            };
        }
        // 1. Analyze problem characteristics
        const complexity = await this.analyzeProblemComplexity(problem);
        const domain = await this.identifyProblemDomain(problem);
        const features = await this.extractProblemFeatures(problem);
        console.log(`Problem analysis: complexity=${complexity}, domain=${domain}, features=[${features.join(', ')}]`);
        // 2. Score each available strategy based on multiple criteria
        const scoredStrategies = await this.scoreStrategies(availableStrategies, {
            complexity,
            domain,
            features,
            resourceConstraints: this.resourceConstraints
        });
        // 3. Select the highest scoring strategy
        let selectedStrategy;
        if (scoredStrategies.length === 0) {
            console.warn('No strategies matched the criteria, using fallback');
            selectedStrategy = {
                name: 'chain_of_thought',
                description: 'Fallback sequential reasoning',
                implementation: 'chain_of_thought_strategy',
                score: 0,
                matchedFeatures: ['fallback']
            };
        }
        else {
            // Sort by score descending
            scoredStrategies.sort((a, b) => b.score - a.score);
            selectedStrategy = scoredStrategies[0];
        }
        console.log(`Selected strategy: ${selectedStrategy.name} (score: ${selectedStrategy.score}, matched: [${selectedStrategy.matchedFeatures.join(', ')}])`);
        // Return the selected strategy
        return {
            name: selectedStrategy.name,
            description: selectedStrategy.description,
            implementation: selectedStrategy.implementation
        };
    }
    /**
     * Analyze problem complexity based on various factors
     * @param problem The problem description
     * @returns Problem complexity level
     */
    async analyzeProblemComplexity(problem) {
        // Word count is a basic proxy for complexity
        const wordCount = problem.split(/\s+/).length;
        // Count question marks as an indicator of multi-part problems
        const questionCount = (problem.match(/\?/g) || []).length;
        // Look for indicators of compound/complex problems
        const hasCompoundIndicators = /\b(and|or|both|either|multi|complex|several|various|multiple)\b/i.test(problem);
        // Look for advanced terminology as an indicator of complexity
        const hasAdvancedTerminology = /\b(algorithm|optimize|recursive|efficiency|constraint|edge case|neural|quantum|implementation|architecture|system design)\b/i.test(problem);
        // Determine complexity based on these factors
        if (wordCount > 200 || questionCount >= 3 || (hasCompoundIndicators && hasAdvancedTerminology)) {
            return ProblemComplexity.VeryHigh;
        }
        else if (wordCount > 100 || questionCount >= 2 || hasAdvancedTerminology) {
            return ProblemComplexity.High;
        }
        else if (wordCount > 50 || questionCount >= 1 || hasCompoundIndicators) {
            return ProblemComplexity.Medium;
        }
        else {
            return ProblemComplexity.Low;
        }
    }
    /**
     * Identify the primary domain of the problem
     * @param problem The problem description
     * @returns Identified problem domain
     */
    async identifyProblemDomain(problem) {
        // Lowercase for consistent matching
        const text = problem.toLowerCase();
        // Define domain-specific keywords
        const domainKeywords = {
            [ProblemDomain.Mathematical]: /\b(math|equation|formula|calcul|algebra|geometry|trigonometry|arithmetic|statistic|probability|number|graph theory)\b/,
            [ProblemDomain.Logical]: /\b(logic|reason|deduc|induc|inference|validity|argument|premise|conclusion|fallacy|syllogism)\b/,
            [ProblemDomain.Creative]: /\b(creativ|design|innovat|novel|artistic|aesthetic|imagination|story|narrative|fiction|poetry)\b/,
            [ProblemDomain.Scientific]: /\b(science|experiment|hypothesis|theory|research|observation|empirical|phenomena|chemistry|physics|biology)\b/,
            [ProblemDomain.Engineering]: /\b(engineer|construct|build|system|technical|mechanical|electrical|software|hardware|architecture|implement)\b/,
            [ProblemDomain.Linguistic]: /\b(language|grammar|syntax|semantic|linguistics|meaning|translation|interpret|text|word|sentence|phrase)\b/,
            [ProblemDomain.Medical]: /\b(medical|health|disease|treatment|diagnosis|patient|clinical|therapy|symptom|medicine|healthcare)\b/,
            [ProblemDomain.Business]: /\b(business|market|financ|economy|profit|revenue|strategy|management|customer|product|service|sales)\b/,
            [ProblemDomain.General]: /\b(general|common|everyday|typical|standard|normal|regular|ordinary|conventional)\b/
        };
        // Find the domain with the most keyword matches
        let bestMatch = ProblemDomain.General;
        let maxMatches = 0;
        for (const [domain, regex] of Object.entries(domainKeywords)) {
            const matches = (text.match(regex) || []).length;
            if (matches > maxMatches) {
                maxMatches = matches;
                bestMatch = domain;
            }
        }
        return bestMatch;
    }
    /**
     * Extract relevant features from the problem
     * @param problem The problem description
     * @returns List of identified features
     */
    async extractProblemFeatures(problem) {
        const features = [];
        const text = problem.toLowerCase();
        // Structure features
        if (/\b(step[s]?|sequence|order|process|workflow|procedure)\b/i.test(text)) {
            features.push('sequential');
        }
        if (/\b(branch|condition|if[\s-]then|decision|alternative|option|path|tree|fork)\b/i.test(text)) {
            features.push('branching');
        }
        if (/\b(parallel|simultaneous|concurrent|multi-threaded|several tracks)\b/i.test(text)) {
            features.push('parallel');
        }
        // Reasoning features
        if (/\b(analy[sz]e|breakdown|critical|evaluate|examine|assess)\b/i.test(text)) {
            features.push('analytical');
        }
        if (/\b(creative|novel|innovative|new|original|imagine|create|design)\b/i.test(text)) {
            features.push('creative');
        }
        if (/\b(compare|contrast|similarity|difference|versus|advantage|disadvantage)\b/i.test(text)) {
            features.push('comparative');
        }
        if (/\b(time|duration|schedule|deadline|quick|fast|rapid|efficient|performance)\b/i.test(text)) {
            features.push('time_sensitive');
        }
        if (/\b(code|algorithm|program|development|software|implementation|function|api|library)\b/i.test(text)) {
            features.push('coding');
        }
        // If no features were identified, add a general feature
        if (features.length === 0) {
            features.push('general');
        }
        return features;
    }
    /**
     * Score strategies based on problem analysis and resource constraints
     */
    async scoreStrategies(strategies, criteria) {
        return strategies.map(strategy => {
            // Initialize score and matched features
            let score = 0;
            const matchedFeatures = [];
            // 1. Match by strategy name and description
            const nameAndDesc = `${strategy.name} ${strategy.description}`.toLowerCase();
            // 2. Score based on complexity match
            switch (criteria.complexity) {
                case ProblemComplexity.VeryHigh:
                    if (nameAndDesc.includes('composite') || nameAndDesc.includes('tree') || nameAndDesc.includes('graph')) {
                        score += 3;
                        matchedFeatures.push('handles_high_complexity');
                    }
                    break;
                case ProblemComplexity.High:
                    if (nameAndDesc.includes('tree') || nameAndDesc.includes('enhanced')) {
                        score += 2;
                        matchedFeatures.push('suitable_for_complex_problems');
                    }
                    break;
                case ProblemComplexity.Medium:
                    if (nameAndDesc.includes('chain') || nameAndDesc.includes('enhanced')) {
                        score += 1.5;
                        matchedFeatures.push('good_for_medium_complexity');
                    }
                    break;
                case ProblemComplexity.Low:
                    // Simple strategies are good for low complexity
                    if (nameAndDesc.includes('basic') || nameAndDesc.includes('chain')) {
                        score += 1;
                        matchedFeatures.push('efficient_for_simple_problems');
                    }
                    break;
            }
            // 3. Score based on domain match (more specific implementation would compare domains)
            if (strategy.name.toLowerCase().includes(criteria.domain)) {
                score += 2;
                matchedFeatures.push(`domain_${criteria.domain}`);
            }
            // 4. Score based on feature match
            for (const feature of criteria.features) {
                if (nameAndDesc.includes(feature)) {
                    score += 1;
                    matchedFeatures.push(`feature_${feature}`);
                }
            }
            // 5. Resource constraints consideration
            if (nameAndDesc.includes('parallel') && criteria.resourceConstraints.parallelCapacity < 2) {
                score -= 2; // Penalize parallel strategies if we don't have capacity
                matchedFeatures.push('resource_constrained_parallel');
            }
            if (nameAndDesc.includes('token efficient') && criteria.resourceConstraints.maxTokens < 4096) {
                score += 1.5; // Bonus for token efficiency when tokens are limited
                matchedFeatures.push('token_efficient');
            }
            if (nameAndDesc.includes('fast') && criteria.resourceConstraints.maxTime < 30000) {
                score += 1.5; // Bonus for fast strategies when time is limited
                matchedFeatures.push('time_efficient');
            }
            // Return the scored strategy
            return {
                ...strategy,
                score,
                matchedFeatures
            };
        });
    }
}
//# sourceMappingURL=AdvancedStrategySelector.js.map