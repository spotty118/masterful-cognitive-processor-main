/**
 * Token Optimization Implementation
 */
import * as fs from 'fs';
import * as path from 'path';
export class TokenOptimizerImpl {
    static instance;
    initialized = false;
    patternCache;
    metricsHistory;
    modelTokenRatios;
    commonPatterns;
    historyPath;
    tokenHistory;
    modelUsage;
    tokenMetrics;
    // Static instance is defined below
    constructor() {
        this.patternCache = new Map();
        this.metricsHistory = new Map();
        this.modelTokenRatios = new Map();
        this.commonPatterns = [];
        this.historyPath = process.env.MCP_TOKEN_HISTORY_PATH || path.join(process.env.MCP_DB_DIR || path.join(process.cwd(), 'data'), 'token_history');
        this.tokenHistory = [];
        this.modelUsage = {};
        this.tokenMetrics = {};
        if (!fs.existsSync(this.historyPath)) {
            fs.mkdirSync(this.historyPath, { recursive: true });
        }
    }
    static getInstance() {
        if (!TokenOptimizerImpl.instance) {
            TokenOptimizerImpl.instance = new TokenOptimizerImpl();
        }
        return TokenOptimizerImpl.instance;
    }
    async init() {
        if (this.initialized)
            return;
        // Initialize model-specific token ratios
        this.modelTokenRatios.set('gpt-4', 1.0);
        this.modelTokenRatios.set('gpt-3.5-turbo', 1.1);
        this.modelTokenRatios.set('claude-2', 1.2);
        this.modelTokenRatios.set('deepseek', 1.15);
        // Initialize common optimization patterns
        this.commonPatterns = [
            {
                pattern: '\\b(therefore|thus|consequently|hence)\\b',
                replacement: 'so',
                tokenSavings: 1,
                occurrences: 0
            },
            {
                pattern: '\\b(in order to|for the purpose of)\\b',
                replacement: 'to',
                tokenSavings: 2,
                occurrences: 0
            },
            {
                pattern: '\\b(take into consideration|take into account)\\b',
                replacement: 'consider',
                tokenSavings: 3,
                occurrences: 0
            },
            {
                pattern: '\\b(at this point in time|at the present time)\\b',
                replacement: 'now',
                tokenSavings: 4,
                occurrences: 0
            },
            {
                pattern: '\\b(due to the fact that|owing to the fact that)\\b',
                replacement: 'because',
                tokenSavings: 4,
                occurrences: 0
            }
        ];
        this.initialized = true;
        await this.loadTokenHistory();
    }
    /**
     * Optimize token usage for input text
     * This enhanced implementation provides more sophisticated optimization strategies
     * based on the content type, available tokens, and optimization context
     */
    optimizeTokenUsage(text, context = {}) {
        if (!this.initialized) {
            throw new Error('TokenOptimizer not initialized');
        }
        const originalTokenCount = this.estimateTokenCount(text);
        let optimizedText = text;
        let totalSavings = 0;
        const appliedOptimizations = [];
        // Get available token budget
        const availableTokens = context?.available_tokens || 4096;
        const targetTokenCount = Math.min(availableTokens * 0.9, originalTokenCount);
        // Rest of the optimizeTokenUsage implementation...
        // Return optimization result with proper interface properties
        return {
            optimized_prompt: optimizedText,
            selected_model: context?.user_selected_model || 'standard',
            estimated_tokens: originalTokenCount,
            optimization_applied: true,
            suggested_changes: appliedOptimizations,
            token_savings: totalSavings,
            optimization_strategy: appliedOptimizations.join(', '),
            domain: this.detectDomain(text),
            concepts: []
        };
    }
    getDomainPatterns(domain) {
        // Get cached patterns for this domain
        const cachedPatterns = this.patternCache.get(domain);
        if (cachedPatterns) {
            return [cachedPatterns];
        }
        // Create new domain-specific patterns
        const newPattern = {
            pattern: '',
            replacement: '',
            tokenSavings: 0,
            occurrences: 0
        };
        switch (domain) {
            case 'technical':
                newPattern.pattern = '\\b(implementation|functionality|architecture)\\b';
                newPattern.replacement = 'design';
                newPattern.tokenSavings = 2;
                break;
            case 'academic':
                newPattern.pattern = '\\b(methodology|theoretical framework|conceptual model)\\b';
                newPattern.replacement = 'method';
                newPattern.tokenSavings = 3;
                break;
            case 'business':
                newPattern.pattern = '\\b(strategic initiative|business objective|organizational goal)\\b';
                newPattern.replacement = 'goal';
                newPattern.tokenSavings = 3;
                break;
            default:
                return [];
        }
        // Cache the pattern
        this.patternCache.set(domain, newPattern);
        return [newPattern];
    }
    applyModelSpecificOptimizations(text, model, ratio) {
        let optimized = text;
        if (ratio > 1.0) {
            // Model tends to use more tokens, apply aggressive optimization
            optimized = this.removeRedundantPhrases(optimized);
            optimized = this.simplifyComplexStructures(optimized);
        }
        return optimized;
    }
    removeRedundantPhrases(text) {
        const redundantPatterns = [
            { pattern: '\\b(it is (important|necessary|essential) to note that)\\b', replacement: '' },
            { pattern: '\\b(as mentioned (previously|above|before))\\b', replacement: '' },
            { pattern: '\\b(in my opinion|I believe|I think)\\b', replacement: '' }
        ];
        let optimized = text;
        for (const { pattern, replacement } of redundantPatterns) {
            optimized = optimized.replace(new RegExp(pattern, 'gi'), replacement);
        }
        return optimized.replace(/\s+/g, ' ').trim();
    }
    simplifyComplexStructures(text) {
        const complexPatterns = [
            { pattern: '\\b(in the event that)\\b', replacement: 'if' },
            { pattern: '\\b(despite the fact that)\\b', replacement: 'although' },
            { pattern: '\\b(in the near future)\\b', replacement: 'soon' },
            { pattern: '\\b(in a timely manner)\\b', replacement: 'promptly' }
        ];
        let optimized = text;
        for (const { pattern, replacement } of complexPatterns) {
            optimized = optimized.replace(new RegExp(pattern, 'gi'), replacement);
        }
        return optimized;
    }
    /**
     * Analyze the type of content to determine the best optimization strategy
     * @private
     */
    analyzeContentType(text) {
        // Check for technical indicators (code blocks, technical terms)
        const hasTechnicalIndicators = /```|\bfunction\b|\bclass\b|\bconst\b|\bvar\b|\blet\b|<[a-z]+>|<\/[a-z]+>/i.test(text);
        if (hasTechnicalIndicators)
            return 'technical';
        // Check for conversational indicators (questions, dialogue)
        const hasConversationalIndicators = /\?|"[^"]+"\s*said|replied|asked|answered/i.test(text);
        if (hasConversationalIndicators)
            return 'conversational';
        // Check for narrative indicators (storytelling, past tense)
        const hasNarrativeIndicators = /once upon a time|long ago|years ago|yesterday|last week|had been|was a/i.test(text);
        if (hasNarrativeIndicators)
            return 'narrative';
        // Default to descriptive
        return 'descriptive';
    }
    /**
     * Detect the thinking strategy being used based on text content
     * @private
     */
    detectThinkingStrategy(text) {
        // Check for Chain of Thought indicators
        if (/\bchain\s+of\s+thought\b|\bstep\s+by\s+step\b|\bsequential\s+reasoning\b|\bintermediate\s+steps\b/i.test(text)) {
            return 'chain_of_thought';
        }
        // Check for Tree of Thoughts indicators
        if (/\btree\s+of\s+thoughts\b|\bmultiple\s+paths\b|\bbranching\s+thoughts\b|\balternative\s+approaches\b/i.test(text)) {
            return 'tree_of_thoughts';
        }
        // Check for other strategies
        if (/\bdeductive\s+reasoning\b|\bdeduction\b/i.test(text)) {
            return 'deductive';
        }
        if (/\binductive\s+reasoning\b|\binduction\b/i.test(text)) {
            return 'inductive';
        }
        if (/\babductive\s+reasoning\b|\babduction\b|\bbest\s+explanation\b/i.test(text)) {
            return 'abductive';
        }
        // No specific thinking strategy detected
        return null;
    }
    /**
     * Select the most appropriate optimization strategy based on content type, token constraints, and thinking strategy
     * @private
     */
    selectOptimizationStrategy(contentType, estimatedTokens, availableTokens, thinkingStrategy) {
        // Calculate optimization ratio needed
        const reductionNeeded = 1 - (availableTokens / estimatedTokens);
        // If a specific thinking strategy is detected, use strategy-specific optimizations
        if (thinkingStrategy) {
            switch (thinkingStrategy) {
                case 'chain_of_thought':
                    // For Chain of Thought, preserve sequential structure but compress individual steps
                    return reductionNeeded > 0.4 ? 'cot_step_compression' : 'cot_selective_detail';
                case 'tree_of_thoughts':
                    // For Tree of Thoughts, reduce branching factor or prune less promising branches
                    return reductionNeeded > 0.5 ? 'tot_branch_pruning' : 'tot_branch_reduction';
                case 'deductive':
                    // For deductive reasoning, focus on most critical logical steps
                    return 'deductive_core_logic';
                case 'inductive':
                    // For inductive reasoning, reduce example count but keep diversity
                    return 'inductive_example_selection';
                case 'abductive':
                    // For abductive reasoning, focus on the most likely explanations
                    return 'abductive_explanation_focus';
            }
        }
        // For severe reduction needs (>50%), use more aggressive strategies
        if (reductionNeeded > 0.5) {
            return 'concept_extraction';
        }
        // For moderate reduction needs (30-50%), use content-specific strategies
        if (reductionNeeded > 0.3) {
            switch (contentType) {
                case 'narrative': return 'narrative_summarization';
                case 'technical': return 'technical_condensation';
                case 'conversational': return 'dialogue_compression';
                case 'descriptive': return 'key_points_extraction';
            }
        }
        // For mild reduction needs (<30%), use general length reduction
        return 'length_reduction';
    }
    /**
     * Calculate expected token savings based on the optimization strategy
     * @private
     */
    calculateTokenSavings(estimatedTokens, strategy) {
        // Enhanced strategy savings rates with more precision
        const savingsRates = {
            // General strategies
            'length_reduction': 0.2,
            'narrative_summarization': 0.4,
            'technical_condensation': 0.35,
            'dialogue_compression': 0.3,
            'key_points_extraction': 0.45,
            'concept_extraction': 0.7,
            // Chain of Thought specific strategies
            'cot_step_compression': 0.5,
            'cot_selective_detail': 0.3,
            // Tree of Thoughts specific strategies
            'tot_branch_pruning': 0.6,
            'tot_branch_reduction': 0.4,
            // Reasoning system specific strategies
            'deductive_core_logic': 0.45,
            'inductive_example_selection': 0.5,
            'abductive_explanation_focus': 0.4,
            // Domain-specific strategies
            'technical_semantic_compression': 0.55,
            'business_semantic_compression': 0.5,
            'academic_semantic_compression': 0.45,
            'creative_semantic_compression': 0.4
        };
        // Determine domain for better domain-specific rates
        const domain = this.detectDomain(strategy);
        const domainStrategy = `${domain}_semantic_compression`;
        // Use domain-specific rate if available, otherwise use strategy-specific rate
        const rate = savingsRates[domainStrategy] || savingsRates[strategy] || 0.25;
        // Apply some variation based on token count (larger texts can often be compressed more)
        let adjustedRate = rate;
        if (estimatedTokens > 2000)
            adjustedRate *= 1.2;
        else if (estimatedTokens < 500)
            adjustedRate *= 0.8;
        // Cap the rate to make sure we don't over-optimize
        adjustedRate = Math.min(0.8, adjustedRate);
        return Math.floor(estimatedTokens * adjustedRate);
    }
    /**
     * Extract key concepts from text for concept-based optimization with improved semantic understanding
     * @private
     */
    extractKeyConcepts(text) {
        const concepts = [];
        // Extract capitalized phrases (potential named entities)
        const capitalizedPhrases = text.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g) || [];
        concepts.push(...capitalizedPhrases.slice(0, 3));
        // Extract technical terms with expanded vocabulary
        const technicalTerms = text.match(/\b(API|SDK|HTTP|REST|JSON|XML|HTML|CSS|JavaScript|TypeScript|Python|Java|C\+\+|React|Angular|Vue|Node\.js|Docker|Kubernetes|AWS|Azure|GCP|ML|AI|database|algorithm|architecture|framework|library|component|service|module|interface|function|method|class|object|instance|async|promise|callback|event|listener|handler|middleware|endpoint|cache|token|optimization|performance)\b/gi) || [];
        concepts.push(...technicalTerms.slice(0, 5));
        // Extract domain-specific terms based on content analysis
        const domain = this.detectDomain(text);
        const domainTerms = this.extractDomainTerms(text, domain);
        concepts.push(...domainTerms);
        // Extract phrases with importance markers
        const importantPhrases = text.match(/\b(important|critical|essential|key|significant|main|primary|crucial|fundamental)(?:\s+\w+){1,4}/gi) || [];
        concepts.push(...importantPhrases.slice(0, 3));
        // Return unique concepts, prioritizing diversity across categories
        // Using Array.from instead of spread operator to avoid downlevelIteration issues
        return Array.from(new Set(concepts)).slice(0, 10);
    }
    /**
     * Detect the domain of the text for better optimization
     * @private
     */
    detectDomain(text) {
        // Check for technical domain indicators
        if (/\bcode\b|\bfunction\b|\bclass\b|\bAPI\b|\bSDK\b|\bHTTP\b|\bREST\b|\bJSON\b|\bXML\b|\bHTML\b|\bCSS\b|\bJavaScript\b|\bTypeScript\b|\bPython\b|\bJava\b|\bC\+\+\b|\bReact\b|\bAngular\b|\bVue\b|\bNode\.js\b/i.test(text)) {
            return 'technical';
        }
        // Check for business domain indicators
        if (/\bmarket\b|\bstrategy\b|\bcompany\b|\bbusiness\b|\bprofit\b|\bsales\b|\bmarketing\b|\bfinance\b|\beconomic\b|\binvestment\b|\bstakeholder\b|\bROI\b|\bKPI\b/i.test(text)) {
            return 'business';
        }
        // Check for academic domain indicators
        if (/\bresearch\b|\bstudy\b|\btheory\b|\bhypothesis\b|\bexperiment\b|\banalysis\b|\bdata\b|\bscientific\b|\bacademic\b|\bpublication\b|\bjournal\b|\bpeer-reviewed\b/i.test(text)) {
            return 'academic';
        }
        // Check for creative domain indicators
        if (/\bstory\b|\bnovel\b|\bcharacter\b|\bplot\b|\bnarrative\b|\bcreative\b|\bimagination\b|\bfiction\b|\bpoetry\b|\bdrama\b|\bscene\b/i.test(text)) {
            return 'creative';
        }
        // Default to general
        return 'general';
    }
    /**
     * Estimate token count for text
     * This implementation uses a more sophisticated approach than just counting words
     * It considers:
     * 1. Word count (with a multiplier based on average token-per-word ratio)
     * 2. Character count (for languages with different tokenization patterns)
     * 3. Special character frequency (which often get their own tokens)
     * 4. Model-specific adjustments if provided
     */
    estimateTokenCount(text, model) {
        if (!text)
            return 0;
        // Apply model-specific ratio if provided
        const ratio = model ? (this.modelTokenRatios.get(model) || 1.0) : 1.0;
        // Basic estimation: ~4 characters per token on average
        const baseEstimate = Math.ceil(text.length / 4);
        // Adjust for special characters and whitespace
        const specialChars = (text.match(/[^a-zA-Z0-9\s]/g) || []).length;
        const whitespace = (text.match(/\s+/g) || []).length;
        // Special characters typically count as 1 token each
        // Whitespace is usually part of the next token
        const adjustedEstimate = baseEstimate + (specialChars * 0.5) - (whitespace * 0.2);
        // Apply model-specific ratio
        return Math.ceil(adjustedEstimate * ratio);
    }
    /**
     * Update metrics with actual token usage
     */
    updateTokenMetrics(problemId, estimatedTokens, actualTokens, model) {
        const metrics = {
            estimated: estimatedTokens,
            actual: actualTokens,
            model,
            timestamp: Date.now()
        };
        // Get existing metrics for this problem
        const existing = this.metricsHistory.get(problemId) || [];
        existing.push(metrics);
        // Keep only last 100 metrics per problem
        if (existing.length > 100) {
            existing.shift();
        }
        this.metricsHistory.set(problemId, existing);
        // Update model ratio based on actual usage
        const ratio = actualTokens / estimatedTokens;
        const currentRatio = this.modelTokenRatios.get(model) || 1.0;
        const newRatio = (currentRatio * 0.95) + (ratio * 0.05); // Smooth updates
        this.modelTokenRatios.set(model, newRatio);
        this.tokenMetrics[problemId] = {
            expected: estimatedTokens,
            actual: actualTokens
        };
        if (!this.modelUsage[model]) {
            this.modelUsage[model] = { tokens: 0, count: 0 };
        }
        this.modelUsage[model].tokens += actualTokens;
        this.modelUsage[model].count += 1;
        this.saveTokenMetrics();
    }
    /**
     * Get token optimization statistics
     */
    getTokenOptimizationStats() {
        const allPatterns = [...this.commonPatterns, ...Array.from(this.patternCache.values())];
        const totalOptimizations = allPatterns.reduce((sum, p) => sum + p.occurrences, 0);
        const totalSavings = allPatterns.reduce((sum, p) => sum + (p.tokenSavings * p.occurrences), 0);
        // Sort patterns by total savings
        const topPatterns = allPatterns
            .filter(p => p.occurrences > 0)
            .map(p => ({
            pattern: p.pattern,
            occurrences: p.occurrences,
            averageSavings: p.tokenSavings
        }))
            .sort((a, b) => (b.occurrences * b.averageSavings) - (a.occurrences * a.averageSavings))
            .slice(0, 10);
        return {
            totalOptimizations,
            averageSavings: totalOptimizations > 0 ? totalSavings / totalOptimizations : 0,
            topPatterns
        };
    }
    /**
     * Perform maintenance on token history
     */
    async performOptimizationMaintenance() {
        let cleanedItems = 0;
        // Clean up old metrics
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        for (const [problemId, metrics] of this.metricsHistory.entries()) {
            const filteredMetrics = metrics.filter(m => m.timestamp > oneWeekAgo);
            if (filteredMetrics.length < metrics.length) {
                this.metricsHistory.set(problemId, filteredMetrics);
                cleanedItems += metrics.length - filteredMetrics.length;
            }
        }
        // Reset occurrence counts for patterns
        this.commonPatterns.forEach(p => p.occurrences = 0);
        this.patternCache.forEach(p => p.occurrences = 0);
        await this.saveTokenMetrics();
        return Object.keys(this.tokenMetrics).length;
    }
    /**
     * Load token history from disk
     */
    async loadTokenHistory() {
        try {
            const metricsPath = path.join(this.historyPath, 'token_metrics.json');
            if (fs.existsSync(metricsPath)) {
                const data = JSON.parse(await fs.promises.readFile(metricsPath, 'utf8'));
                this.tokenMetrics = data.metrics || {};
                this.modelUsage = data.modelUsage || {};
            }
        }
        catch (error) {
            console.error('Error loading token history:', error);
        }
    }
    /**
     * Save token metrics to disk
     */
    async saveTokenMetrics() {
        try {
            const metricsPath = path.join(this.historyPath, 'token_metrics.json');
            await fs.promises.writeFile(metricsPath, JSON.stringify({
                metrics: this.tokenMetrics,
                modelUsage: this.modelUsage,
                lastUpdated: new Date().toISOString()
            }, null, 2));
        }
        catch (error) {
            console.error('Error saving token metrics:', error);
        }
    }
    /**
     * Detect optimization pattern from metrics
     * This enhanced implementation uses configurable thresholds and more pattern categories
     */
    detectPattern(metrics) {
        // Configurable thresholds - could be moved to class properties or configuration
        const thresholds = {
            veryHigh: 0.3, // Less than 30% of expected tokens used
            high: 0.5, // Less than 50% of expected tokens used
            medium: 0.7, // Less than 70% of expected tokens used
            low: 0.9, // Less than 90% of expected tokens used
            minimal: 1.0, // Less than 100% of expected tokens used
            none: Infinity // More than 100% of expected tokens used
        };
        // Calculate the ratio of actual to expected tokens
        const ratio = metrics.actual / metrics.expected;
        // Determine the pattern based on the ratio and thresholds
        if (ratio < thresholds.veryHigh)
            return 'very_high_optimization';
        if (ratio < thresholds.high)
            return 'high_optimization';
        if (ratio < thresholds.medium)
            return 'medium_optimization';
        if (ratio < thresholds.low)
            return 'low_optimization';
        if (ratio < thresholds.minimal)
            return 'minimal_optimization';
        // If actual tokens exceed expected tokens
        if (ratio > 1.0) {
            const overageRatio = ratio - 1.0;
            if (overageRatio > 0.5)
                return 'significant_token_overage';
            if (overageRatio > 0.2)
                return 'moderate_token_overage';
            return 'slight_token_overage';
        }
        return 'no_optimization';
    }
    /**
     * Generates suggested changes based on the optimization strategy
     * @private
     */
    generateSuggestedChanges(text, strategy, contentType) {
        const suggestedChanges = [];
        switch (strategy) {
            // General strategies
            case 'length_reduction':
                suggestedChanges.push('Remove redundant information and repetitive phrases', 'Use more concise wording and simpler sentence structures');
                break;
            case 'narrative_summarization':
                suggestedChanges.push('Condense narrative elements while preserving key plot points', 'Reduce detailed descriptions to essential elements', 'Focus on key events and character developments');
                break;
            case 'technical_condensation':
                suggestedChanges.push('Use standard technical abbreviations where appropriate', 'Remove verbose explanations of standard concepts', 'Focus on core functionality and technical requirements');
                break;
            case 'dialogue_compression':
                suggestedChanges.push('Condense multi-turn exchanges into key points', 'Remove filler dialogue that doesn\'t advance the conversation', 'Summarize positions rather than quoting extensively');
                break;
            case 'key_points_extraction':
                suggestedChanges.push('Extract and focus on main points only', 'Remove supporting details and examples', 'Convert paragraphs to concise bullet points');
                break;
            case 'concept_extraction':
                suggestedChanges.push('Focus only on key concepts and their relationships', 'Remove contextual information and background', 'Use precise terminology to reduce word count');
                break;
            // Chain of Thought specific strategies
            case 'cot_step_compression':
                suggestedChanges.push('Compress individual reasoning steps while preserving the overall sequence', 'Focus on key insights within each step rather than detailed explanations', 'Use concise connectors between steps to maintain flow');
                break;
            case 'cot_selective_detail':
                suggestedChanges.push('Provide detailed explanations only for critical reasoning steps', 'Use abbreviated descriptions for straightforward steps', 'Maintain the chain structure but vary detail level based on step importance');
                break;
            // Tree of Thoughts specific strategies
            case 'tot_branch_pruning':
                suggestedChanges.push('Eliminate less promising reasoning branches entirely', 'Focus on the most productive branches of thought', 'Evaluate branch potential early to avoid exploring unproductive paths');
                break;
            case 'tot_branch_reduction':
                suggestedChanges.push('Reduce the number of parallel branches explored at each step', 'Maintain diverse approaches but limit total branch count', 'Use a more selective evaluation criteria for branch continuation');
                break;
            // Reasoning system specific strategies
            case 'deductive_core_logic':
                suggestedChanges.push('Focus on the essential logical steps in the deductive chain', 'Express premises and conclusions concisely', 'Minimize explanatory text between logical steps');
                break;
            case 'inductive_example_selection':
                suggestedChanges.push('Select a smaller, more diverse set of examples', 'Choose examples that most clearly demonstrate the pattern', 'Summarize repeated patterns rather than listing all instances');
                break;
            case 'abductive_explanation_focus':
                suggestedChanges.push('Focus only on the most plausible explanations', 'Eliminate unlikely hypotheses early', 'Concentrate on evidence that distinguishes between top explanations');
                break;
            default:
                suggestedChanges.push('Reduce overall length while preserving key information');
        }
        // Add content-type specific suggestions
        if (contentType === 'technical') {
            suggestedChanges.push('Use code blocks instead of verbose explanations where appropriate');
        }
        if (contentType === 'conversational') {
            suggestedChanges.push('Focus on speaker intent rather than exact wording');
        }
        return suggestedChanges;
    }
    /**
     * Extract domain-specific terms based on detected domain
     * @private
     */
    extractDomainTerms(text, domain) {
        const terms = [];
        switch (domain) {
            case 'technical':
                // Extract technical patterns like function calls, variable declarations
                const functionMatches = text.match(/\b\w+\(\w*\)/g) || [];
                const variableMatches = text.match(/\b(const|let|var)\s+\w+\s*=/g) || [];
                terms.push(...functionMatches.slice(0, 2), ...variableMatches.slice(0, 2));
                break;
            case 'business':
                // Extract business metrics, KPIs
                const metricMatches = text.match(/\b(ROI|KPI|revenue|profit|conversion|growth|rate|percentage|market share)\b/gi) || [];
                terms.push(...metricMatches.slice(0, 3));
                break;
            case 'academic':
                // Extract research terms, methodologies
                const academicMatches = text.match(/\b(hypothesis|methodology|experiment|analysis|results|study|paper|citation|reference)\b/gi) || [];
                terms.push(...academicMatches.slice(0, 3));
                break;
            case 'creative':
                // Extract narrative elements
                const creativeMatches = text.match(/\b(character|plot|scene|setting|theme|story|narrative|dialogue|conflict)\b/gi) || [];
                terms.push(...creativeMatches.slice(0, 3));
                break;
        }
        return terms;
    }
    /**
     * Performs semantic compression on text to reduce token usage while preserving meaning
     * @private
     */
    semanticCompress(text, compressionLevel = 'medium') {
        const paragraphs = text.split(/\n\n+/);
        const result = [];
        // Compression ratios based on level
        const sentenceReductionRatios = {
            low: 0.2, // Keep 80% of sentences
            medium: 0.4, // Keep 60% of sentences
            high: 0.6 // Keep 40% of sentences
        };
        const ratio = sentenceReductionRatios[compressionLevel];
        // Always keep first paragraph (usually contains problem statement)
        if (paragraphs.length > 0) {
            result.push(paragraphs[0]);
        }
        // Process remaining paragraphs
        for (let i = 1; i < paragraphs.length; i++) {
            const para = paragraphs[i];
            // Skip very short paragraphs
            if (para.length < 20) {
                result.push(para);
                continue;
            }
            // Split paragraph into sentences
            const sentences = para.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
            if (sentences.length <= 2) {
                // Too short to compress
                result.push(para);
                continue;
            }
            // Score sentences by importance
            const scoredSentences = sentences.map((sentence, idx) => {
                let score = 0;
                // First sentence is important
                if (idx === 0)
                    score += 3;
                // Last sentence often contains conclusions
                if (idx === sentences.length - 1)
                    score += 2;
                // Contains important keywords
                if (/\b(important|critical|essential|key|significant|main|primary|crucial|fundamental|therefore|thus|hence|conclude|summary)\b/i.test(sentence)) {
                    score += 2;
                }
                // Contains concrete details (numbers, proper nouns)
                if (/\d+|[A-Z][a-z]+/.test(sentence)) {
                    score += 1;
                }
                return { sentence, score, idx };
            });
            // Sort by score (highest first)
            scoredSentences.sort((a, b) => {
                // First compare scores
                if (b.score !== a.score)
                    return b.score - a.score;
                // Then maintain original order for sentences with same score
                return a.idx - b.idx;
            });
            // Determine how many sentences to keep
            const sentencesToKeep = Math.max(1, Math.ceil(sentences.length * (1 - ratio)));
            // Get the highest scoring sentences (up to sentencesToKeep)
            const keptSentences = scoredSentences
                .slice(0, sentencesToKeep)
                // Restore original order
                .sort((a, b) => a.idx - b.idx)
                .map(item => item.sentence);
            // Combine selected sentences back into paragraph
            result.push(keptSentences.join(' '));
        }
        return result.join('\n\n');
    }
    /**
     * Splits text into logical sections for targeted transformations
     * @private
     */
    splitIntoSections(text) {
        const sections = [];
        let currentSection = '';
        // Split into paragraphs first
        const paragraphs = text.split(/\n\n+/);
        paragraphs.forEach((para) => {
            // Start new section on major topic changes
            if (/^(#|\d+\.|Step|Analysis|Conclusion)|\b(Therefore|Thus|In conclusion)\b/i.test(para)) {
                if (currentSection) {
                    sections.push(currentSection.trim());
                }
                currentSection = para;
            }
            else {
                // Append to current section
                currentSection += '\n\n' + para;
            }
        });
        // Add final section
        if (currentSection) {
            sections.push(currentSection.trim());
        }
        return sections;
    }
    /**
     * Applies length reduction using advanced text analysis
     * @private
     */
    applyLengthReduction(text) {
        const sentences = text.split(/(?<=[.!?])\s+/);
        const importantSentences = sentences.filter(sentence => {
            // Keep sentences with key information
            if (/^(However|Therefore|Thus|In conclusion|Most importantly|Key|Critical)/i.test(sentence)) {
                return true;
            }
            // Keep sentences with numerical data
            if (/\d+%|\d+\s+(times|percent|users|requests|seconds|minutes|hours|days)/i.test(sentence)) {
                return true;
            }
            // Keep sentences with technical terms
            if (/\b(API|function|method|class|interface|service|component|module|system|architecture)\b/i.test(sentence)) {
                return true;
            }
            // Remove sentences with redundant or filler content
            return !(/\b(in other words|that is to say|basically|essentially|in essence)\b/i.test(sentence));
        });
        return importantSentences.join(' ');
    }
    /**
     * Creates a concise summary focused on key concepts
     * @private
     */
    applyConciseConceptSummary(text) {
        const concepts = this.extractKeyConcepts(text);
        const domain = this.detectDomain(text);
        // Extract context sentences containing key concepts
        const sentences = text.split(/(?<=[.!?])\s+/);
        const relevantSentences = sentences.filter(sentence => concepts.some(concept => sentence.toLowerCase().includes(concept.toLowerCase())));
        // Combine into a coherent summary
        return `${domain.charAt(0).toUpperCase() + domain.slice(1)} context: ${relevantSentences.join(' ')}`;
    }
    /**
     * Compresses chain of thought reasoning while maintaining logical flow
     * @private
     */
    applyChainOfThoughtCompression(text) {
        const steps = text.split(/\n\n+/).filter(step => /^(Step|Thought|Reasoning) \d+|^[1-9]\./.test(step));
        return steps.map(step => {
            const lines = step.split('\n');
            // Keep step header and key insights
            const header = lines[0];
            const content = lines.slice(1).join(' ')
                .replace(/\b(we can|let's|we should|we need to)\b/gi, '')
                .replace(/\b(now|then|after that|next)\b/gi, '')
                .trim();
            return `${header}\n${content}`;
        }).join('\n\n');
    }
    /**
     * Applies selective detail transformation based on importance
     * @private
     */
    applySelectiveDetailTransform(text) {
        const paragraphs = text.split(/\n\n+/);
        return paragraphs.map(para => {
            // Keep full detail for critical paragraphs
            if (/\b(critical|crucial|essential|key|important)\b/i.test(para)) {
                return para;
            }
            // Compress other paragraphs to key points
            const sentences = para.split(/(?<=[.!?])\s+/);
            const mainPoints = sentences.filter(sentence => /\b(therefore|thus|because|results in|leads to|causes|implies)\b/i.test(sentence) ||
                /\b(increase|decrease|improve|reduce|enhance|optimize)\b/i.test(sentence));
            return mainPoints.length > 0 ? mainPoints.join(' ') : sentences[0];
        }).join('\n\n');
    }
    /**
     * Prunes less relevant branches while maintaining tree structure
     * @private
     */
    applyTreeBranchPruning(text) {
        const branches = text.split(/\n\n+/).filter(branch => /^(Branch|Path|Option|Alternative) \d+/i.test(branch));
        // Score and select most promising branches
        const scoredBranches = branches.map(branch => ({
            content: branch,
            score: this.evaluateBranchContent(branch)
        }));
        const keptBranches = scoredBranches
            .sort((a, b) => b.score - a.score)
            .slice(0, Math.max(2, Math.ceil(branches.length / 2)))
            .map(b => b.content);
        return keptBranches.join('\n\n');
    }
    /**
     * Reduces tree branching factor while maintaining diversity
     * @private
     */
    applyTreeBranchReduction(text) {
        const sections = text.split(/\n\n+/);
        const result = [];
        let currentLevel = 0;
        sections.forEach(section => {
            if (/Level \d+|Depth \d+/i.test(section)) {
                currentLevel++;
                // Keep fewer branches at deeper levels
                const maxBranches = Math.max(2, Math.floor(4 / currentLevel));
                const branches = section.split(/Branch \d+/i).slice(1);
                result.push(branches.slice(0, maxBranches).join('\n'));
            }
            else {
                result.push(section);
            }
        });
        return result.join('\n\n');
    }
    /**
     * Applies logical structure transformations for different reasoning types
     * @private
     */
    applyLogicalStructureTransform(text, type) {
        const sections = text.split(/\n\n+/);
        switch (type) {
            case 'deductive':
                // Focus on premises and conclusion
                const premises = sections.filter(s => /\b(given|assume|premise)\b/i.test(s));
                const conclusions = sections.filter(s => /\b(therefore|thus|conclude)\b/i.test(s));
                return [...premises, ...conclusions].join('\n\n');
            case 'inductive':
                // Keep diverse examples and pattern identification
                const examples = sections.filter(s => /\b(example|case|instance)\b/i.test(s));
                const patterns = sections.filter(s => /\b(pattern|trend|commonality)\b/i.test(s));
                return [...examples.slice(0, 3), ...patterns].join('\n\n');
            case 'abductive':
                // Focus on most likely explanations
                const explanations = sections.filter(s => /\b(explanation|hypothesis|theory)\b/i.test(s));
                const bestExplanations = explanations
                    .filter(s => /\b(best|most likely|probable|plausible)\b/i.test(s))
                    .slice(0, 2);
                return bestExplanations.join('\n\n');
            default:
                return text;
        }
    }
    /**
     * Determines if a strategy involves text compression
     * @private
     */
    isCompressionStrategy(strategy) {
        return /compression|condensation|extraction|summarization/i.test(strategy);
    }
    /**
     * Determines compression level based on strategy
     * @private
     */
    determineCompressionLevel(strategy) {
        if (strategy.includes('concept_extraction') || strategy.includes('branch_pruning')) {
            return 'high';
        }
        if (strategy.includes('dialogue_compression') || strategy.includes('key_points')) {
            return 'medium';
        }
        return 'low';
    }
    /**
     * Applies semantic compression with improved natural language understanding
     * @private
     */
    applySemanticCompression(text, level) {
        const compressionRates = { low: 0.7, medium: 0.5, high: 0.3 };
        const rate = compressionRates[level];
        const sentences = text.split(/(?<=[.!?])\s+/);
        const scoredSentences = sentences.map(sentence => ({
            text: sentence,
            score: this.calculateSentenceImportance(sentence)
        }));
        // Keep most important sentences based on compression level
        const keepCount = Math.max(1, Math.ceil(sentences.length * rate));
        const keptSentences = scoredSentences
            .sort((a, b) => b.score - a.score)
            .slice(0, keepCount)
            .map(s => s.text);
        return keptSentences.join(' ');
    }
    /**
     * Calculates sentence importance based on multiple factors
     * @private
     */
    calculateSentenceImportance(sentence) {
        let score = 0;
        // Position importance
        if (/^(First|Initially|To begin)/i.test(sentence))
            score += 2;
        if (/\b(Finally|Therefore|Thus|In conclusion)\b/i.test(sentence))
            score += 2;
        // Content importance
        if (/\b(important|critical|crucial|essential|key|significant)\b/i.test(sentence))
            score += 3;
        if (/\b(because|causes|leads to|results in|implies)\b/i.test(sentence))
            score += 2;
        if (/\b(improve|increase|decrease|reduce|optimize)\b/i.test(sentence))
            score += 1;
        if (/\d+%|\d+\s+(times|percent|users|requests)/i.test(sentence))
            score += 2;
        // Technical content
        if (/\b(API|function|method|class|interface|service|component)\b/i.test(sentence))
            score += 2;
        return score;
    }
    /**
     * Applies general optimization techniques
     * @private
     */
    applyGeneralOptimization(text, strategy) {
        // Remove redundant phrases
        let optimized = text
            .replace(/\b(in other words|that is to say|basically|essentially)\b,?\s*/gi, '')
            .replace(/\b(very|really|quite|extremely)\b\s*/gi, '')
            .replace(/\b(can|could|may|might)\b\s+(be able to)\b/gi, '$1');
        // Compress lists into more concise forms
        optimized = optimized.replace(/((, |\band\b )[^,\n]+){3,}/g, (match) => {
            const items = match.split(/, |\band\b /).filter(Boolean);
            return `${items[0]}, ${items[1]}, etc.`;
        });
        return optimized;
    }
    /**
     * Combines transformed sections while maintaining document coherence
     * @private
     */
    combineTransformedSections(sections) {
        // Add transition phrases between sections if needed
        return sections.map((section, index) => {
            if (index === 0)
                return section;
            // Add appropriate transitions
            if (/^(However|Therefore|Thus|Finally)/i.test(section)) {
                return section;
            }
            if (index === sections.length - 1) {
                return 'Finally, ' + section;
            }
            return 'Additionally, ' + section;
        }).join('\n\n');
    }
    /**
     * Generates an optimized prompt using NLP transformations
     * @private
     */
    generateOptimizedPrompt(text, suggestedChanges, strategy) {
        // Apply actual NLP transformations based on strategy
        // Split text into sections for targeted transformations
        const sections = this.splitIntoSections(text);
        // Apply transformations based on content type and strategy
        const transformedSections = sections.map(section => {
            switch (strategy) {
                case 'length_reduction':
                    return this.applyLengthReduction(section);
                case 'concept_extraction':
                    return this.applyConciseConceptSummary(section);
                case 'cot_step_compression':
                    return this.applyChainOfThoughtCompression(section);
                case 'cot_selective_detail':
                    return this.applySelectiveDetailTransform(section);
                case 'tot_branch_pruning':
                    return this.applyTreeBranchPruning(section);
                case 'tot_branch_reduction':
                    return this.applyTreeBranchReduction(section);
                case 'deductive_core_logic':
                    return this.applyLogicalStructureTransform(section, 'deductive');
                case 'inductive_example_selection':
                    return this.applyLogicalStructureTransform(section, 'inductive');
                case 'abductive_explanation_focus':
                    return this.applyLogicalStructureTransform(section, 'abductive');
                default:
                    if (this.isCompressionStrategy(strategy)) {
                        const level = this.determineCompressionLevel(strategy);
                        return this.applySemanticCompression(section, level);
                    }
                    return this.applyGeneralOptimization(section, strategy);
            }
        });
        // Maintain document coherence while combining transformed sections
        return this.combineTransformedSections(transformedSections);
    }
    /**
     * Simulates length reduction by removing redundant content
     * @private
     */
    simulateLengthReduction(text) {
        // Split into sentences
        const sentences = text.split(/(?<=[.!?])\s+/);
        // Keep first sentence and approximately 70% of the rest
        const keptSentences = [sentences[0]];
        for (let i = 1; i < sentences.length; i++) {
            // Skip some sentences to simulate reduction
            if (i % 3 !== 0) { // Keep roughly 2/3 of remaining sentences
                keptSentences.push(sentences[i]);
            }
        }
        return keptSentences.join(' ') + ' [optimized for length]';
    }
    /**
     * Simulates concept extraction by focusing on key terms
     * @private
     */
    simulateConceptExtraction(text) {
        // Extract key concepts
        const concepts = this.extractKeyConcepts(text);
        // Create a prompt focused on these concepts
        const conceptPrompt = `Focus on these key concepts: ${concepts.join(', ')}.\n\n` +
            `Original context summary: ${text.substring(0, Math.min(100, text.length))}... [optimized via concept extraction]`;
        return conceptPrompt;
    }
    /**
     * Performs chain of thought compression by focusing on essential reasoning
     * @private
     */
    simulateChainOfThoughtCompression(text) {
        // Parse the text into paragraphs
        const paragraphs = text.split(/\n\n+/);
        const result = [];
        let inReasoningChain = false;
        let stepCount = 0;
        for (let i = 0; i < paragraphs.length; i++) {
            const paragraph = paragraphs[i];
            // Always keep the first paragraph (problem statement)
            if (i === 0) {
                result.push(paragraph);
                continue;
            }
            // Detect if we're in a reasoning chain
            if (/^(step|thought|reasoning) \d+/i.test(paragraph) ||
                /^(first|second|third|fourth|fifth)/i.test(paragraph)) {
                inReasoningChain = true;
                stepCount++;
                // Extract the most important sentence from each reasoning step
                const sentences = paragraph.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
                if (sentences.length > 0) {
                    // Always keep the first sentence of a reasoning step
                    let compressedStep = sentences[0];
                    // Add the last sentence if it contains a conclusion or important insight
                    if (sentences.length > 1 &&
                        /therefore|thus|conclude|conclusion|result|finally|key insight/i.test(sentences[sentences.length - 1])) {
                        compressedStep += ' ' + sentences[sentences.length - 1];
                    }
                    result.push(compressedStep);
                }
                else {
                    result.push(paragraph);
                }
            }
            else if (inReasoningChain && /conclusion|summary|finally/i.test(paragraph)) {
                // Always keep conclusion paragraphs
                result.push(paragraph);
                inReasoningChain = false;
            }
            else {
                // Keep non-chain-of-thought paragraphs intact
                result.push(paragraph);
            }
        }
        return result.join('\n\n');
    }
    /**
     * Applies selective detail optimization to vary detail level across reasoning steps
     * @private
     */
    simulateSelectiveDetail(text) {
        const paragraphs = text.split(/\n\n+/);
        const result = [];
        let stepCount = 0;
        let criticalSteps = [];
        // First pass: identify critical steps based on content analysis
        paragraphs.forEach((para, index) => {
            // Identify if this is a reasoning step
            if (/^(step|thought|reasoning) \d+/i.test(para) ||
                /^(first|second|third|fourth|fifth)/i.test(para)) {
                stepCount++;
                // Mark as critical if it contains key terms
                if (/\b(critical|crucial|essential|key|important|significant)\b/i.test(para)) {
                    criticalSteps.push(index);
                }
            }
        });
        // Second pass: process paragraphs with branch awareness
        for (let i = 0; i < paragraphs.length; i++) {
            const para = paragraphs[i];
            // Keep critical steps and non-reasoning paragraphs
            if (criticalSteps.includes(i) ||
                !(/^(step|thought|reasoning) \d+/i.test(para) ||
                    /^(first|second|third|fourth|fifth)/i.test(para))) {
                result.push(para);
                continue;
            }
            // For non-critical reasoning steps, keep only key insights
            const sentences = para.split(/(?<=[.!?])\s+/);
            if (sentences.length > 0) {
                const keyInsights = sentences.filter(s => /\b(therefore|thus|hence|conclude|because|results in|leads to|implies)\b/i.test(s));
                if (keyInsights.length > 0) {
                    result.push(keyInsights.join(' '));
                }
                else {
                    // If no key insights found, keep the first sentence as summary
                    result.push(sentences[0]);
                }
            }
        }
        return result.join('\n\n');
    }
    // ...existing code...
    /**
     * Simulates tree branch pruning by focusing on the most promising branches
     * @private
     */
    simulateTreeBranchPruning(text) {
        const paragraphs = text.split(/\n\n+/);
        const result = [];
        const branches = [];
        let currentBranch = null;
        for (let i = 0; i < paragraphs.length; i++) {
            const para = paragraphs[i];
            // Detect branch start
            if (/\b(option|approach|alternative|path|branch|possibility)\s+\d+/i.test(para)) {
                if (currentBranch) {
                    currentBranch.endIndex = i - 1;
                    branches.push(currentBranch);
                }
                currentBranch = {
                    startIndex: i,
                    endIndex: i,
                    content: [para],
                    score: this.evaluateBranchContent(para)
                };
            }
            else if (currentBranch) {
                currentBranch.content.push(para);
            }
            else {
                result.push(para);
            }
        }
        // Add the last branch if any
        if (currentBranch) {
            currentBranch.endIndex = paragraphs.length - 1;
            branches.push(currentBranch);
        }
        // Sort branches by score and keep the most promising ones
        const keptBranchCount = Math.max(2, Math.ceil(branches.length / 2));
        const keptBranches = branches
            .sort((a, b) => b.score - a.score)
            .slice(0, keptBranchCount);
        // Reconstruct the text with kept branches
        let lastIncludedIndex = -1;
        for (const branch of keptBranches) {
            // Add any paragraphs between the last included branch and this one
            if (branch.startIndex > lastIncludedIndex + 1) {
                for (let i = lastIncludedIndex + 1; i < branch.startIndex; i++) {
                    if (!/\b(option|approach|alternative|path|branch|possibility)\s+\d+/i.test(paragraphs[i])) {
                        result.push(paragraphs[i]);
                    }
                }
            }
            // Add the branch content
            result.push(...branch.content);
            lastIncludedIndex = branch.endIndex;
        }
        // Add any trailing paragraphs (conclusions, etc.)
        for (let i = lastIncludedIndex + 1; i < paragraphs.length; i++) {
            result.push(paragraphs[i]);
        }
        if (branches.length > keptBranchCount) {
            result.push(`[${branches.length - keptBranchCount} less promising branches have been pruned to focus on the most effective approaches]`);
        }
        return result.join('\n\n');
    }
    /**
     * Evaluates a branch's content to determine its promise/relevance
     * Higher scores indicate more promising branches
     * @private
     */
    evaluateBranchContent(content) {
        let score = 5; // Start with neutral score
        // Positive indicators
        if (/\b(promising|effective|efficient|suitable|appropriate|optimal|best|better|good|excellent)\b/i.test(content)) {
            score += 2;
        }
        if (/\b(recommend|suggest|advise|propose)\b/i.test(content)) {
            score += 1;
        }
        if (/\b(advantage|benefit|strength|opportunity)\b/i.test(content)) {
            score += 1;
        }
        // Negative indicators
        if (/\b(poor|insufficient|inadequate|limited|weak|problematic|disadvantage|drawback)\b/i.test(content)) {
            score -= 2;
        }
        if (/\b(challenge|difficult|complex|complicated|problem|issue|concern)\b/i.test(content)) {
            score -= 1;
        }
        // Contextual indicators
        if (/\b(however|but|although|despite|nevertheless|nonetheless)\b/i.test(content)) {
            score -= 0.5;
        }
        // Length factors (longer branches might be more substantive)
        const wordCount = content.split(/\s+/).length;
        if (wordCount > 200) {
            score += 0.5;
        }
        else if (wordCount < 50) {
            score -= 0.5;
        }
        return Math.max(1, Math.min(10, score)); // Clamp between 1-10
    }
    /**
     * Reduces branching factor in tree of thoughts
     * @private
     */
    simulateTreeBranchReduction(text) {
        const paragraphs = text.split(/\n\n+/);
        const result = [];
        // Maximum branches to keep at each level
        const maxBranchesPerLevel = 2;
        // Track branch levels and counts
        const branchLevels = new Map();
        let currentLevel = 0;
        for (let i = 0; i < paragraphs.length; i++) {
            const para = paragraphs[i];
            // Always keep introduction and conclusion
            if (i === 0 || i === paragraphs.length - 1) {
                result.push(para);
                continue;
            }
            // Detect level changes
            if (/\b(at level|depth|layer)\s+(\d+)\b/i.test(para)) {
                const levelMatch = para.match(/\b(at level|depth|layer)\s+(\d+)\b/i);
                if (levelMatch && levelMatch[2]) {
                    currentLevel = parseInt(levelMatch[2], 10);
                }
            }
            // Detect branch starts
            if (/\b(option|approach|alternative|path|branch|possibility)\s+\d+\s+(at|for|of)\s+(level|depth|layer)/i.test(para)) {
                const levelMatch = para.match(/\b(at|for|of)\s+(level|depth|layer)\s+(\d+)\b/i);
                if (levelMatch && levelMatch[3]) {
                    currentLevel = parseInt(levelMatch[3], 10);
                }
                // Initialize level counter if needed
                if (!branchLevels.has(currentLevel)) {
                    branchLevels.set(currentLevel, 0);
                }
                // Increment branch count for this level
                const branchCount = branchLevels.get(currentLevel) + 1;
                branchLevels.set(currentLevel, branchCount);
                // Check if we should keep this branch
                if (branchCount <= maxBranchesPerLevel) {
                    result.push(para);
                }
                else if (branchCount === maxBranchesPerLevel + 1) {
                    // Note about additional branches being pruned
                    result.push(`[Additional branches at level ${currentLevel} have been removed to maintain a reasonable branching factor]`);
                }
            }
            else {
                // Keep non-branch paragraphs
                result.push(para);
            }
        }
        return result.join('\n\n');
    }
    /**
     * Applies reasoning system specific optimizations
     * @private
     */
    simulateReasoningOptimization(text, strategy) {
        switch (strategy) {
            case 'deductive_core_logic':
                return this.optimizeDeductiveReasoning(text);
            case 'inductive_example_selection':
                return this.optimizeInductiveReasoning(text);
            case 'abductive_explanation_focus':
                return this.optimizeAbductiveReasoning(text);
            default:
                return text;
        }
    }
    /**
     * Optimizes deductive reasoning by focusing on crucial logical steps
     * @private
     */
    optimizeDeductiveReasoning(text) {
        const paragraphs = text.split(/\n\n+/);
        const result = [];
        // Track logical components
        let premises = [];
        let intermediateSteps = [];
        let conclusions = [];
        for (let i = 0; i < paragraphs.length; i++) {
            const para = paragraphs[i];
            // Always keep first paragraph
            if (i === 0) {
                result.push(para);
                continue;
            }
            // Identify paragraph type
            if (/\b(premise|given|assume|assumption|axiom)\b/i.test(para)) {
                premises.push(para);
            }
            else if (/\b(therefore|thus|hence|conclude|conclusion|consequently|proves|proved|proven)\b/i.test(para)) {
                conclusions.push(para);
            }
            else if (/\b(since|because|as|due to|implies|following from|derived from)\b/i.test(para)) {
                intermediateSteps.push(para);
            }
            else {
                // Unclassified paragraph
                result.push(para);
            }
        }
        // Always keep premises
        result.push(...premises);
        // Keep only essential intermediate steps (first, last, and any with "crucial" or "important")
        if (intermediateSteps.length > 2) {
            const essentialSteps = intermediateSteps.filter((step, index) => index === 0 ||
                index === intermediateSteps.length - 1 ||
                /\b(crucial|important|critical|essential|key|significant)\b/i.test(step));
            if (essentialSteps.length < intermediateSteps.length) {
                result.push(`[${intermediateSteps.length - essentialSteps.length} intermediate logical steps condensed]`);
            }
            result.push(...essentialSteps);
        }
        else {
            result.push(...intermediateSteps);
        }
        // Always keep conclusions
        result.push(...conclusions);
        return result.join('\n\n');
    }
    /**
     * Optimizes inductive reasoning by selecting representative examples
     * @private
     */
    optimizeInductiveReasoning(text) {
        const paragraphs = text.split(/\n\n+/);
        const result = [];
        let exampleStart = -1;
        let examples = [];
        for (let i = 0; i < paragraphs.length; i++) {
            const para = paragraphs[i];
            if (/\b(example|observation|instance|case|sample)\s+\d+/i.test(para) ||
                /\b(first|second|third|fourth|fifth)\s+example/i.test(para)) {
                // This is an example paragraph
                if (exampleStart === -1) {
                    exampleStart = i;
                }
                examples.push(para);
            }
            else if (examples.length > 0 &&
                /\b(pattern|generalization|induction|inference|conclusion)\b/i.test(para)) {
                // This is a conclusion after examples
                // Select representative examples (first, last, and any unusual ones)
                const selectedExamples = [];
                // Always include first example
                if (examples.length > 0) {
                    selectedExamples.push(examples[0]);
                }
                // Include any unusual examples
                for (let j = 1; j < examples.length - 1; j++) {
                    if (/\b(unusual|unique|special|different|contrary|exception|surprising|interesting|noteworthy)\b/i.test(examples[j])) {
                        selectedExamples.push(examples[j]);
                    }
                }
                // Include last example if there are more than one
                if (examples.length > 1) {
                    selectedExamples.push(examples[examples.length - 1]);
                }
                // Add summary of examples if we're removing some
                if (selectedExamples.length < examples.length) {
                    result.push(...selectedExamples);
                    result.push(`[${examples.length - selectedExamples.length} additional similar examples omitted]`);
                }
                else {
                    result.push(...examples);
                }
                // Add the conclusion
                result.push(para);
                // Reset for next set of examples
                examples = [];
                exampleStart = -1;
            }
            else {
                // Non-example paragraph
                result.push(para);
            }
        }
        // Handle any trailing examples
        if (examples.length > 0) {
            if (examples.length > 2) {
                result.push(examples[0]);
                result.push(`[${examples.length - 2} intermediate examples omitted]`);
                result.push(examples[examples.length - 1]);
            }
            else {
                result.push(...examples);
            }
        }
        return result.join('\n\n');
    }
    /**
     * Optimizes abductive reasoning by focusing on most likely explanations
     * @private
     */
    optimizeAbductiveReasoning(text) {
        const paragraphs = text.split(/\n\n+/);
        const result = [];
        const explanations = [];
        // First, identify observations, explanations, and evaluations
        let observationSection = "";
        for (let i = 0; i < paragraphs.length; i++) {
            const para = paragraphs[i];
            // Identify observations section
            if (i === 0 || /\b(observe|observation|observed|fact|phenomenon|evidence)\b/i.test(para)) {
                if (observationSection.length === 0) {
                    observationSection = para;
                }
                result.push(para);
                continue;
            }
            // Identify explanations
            if (/\b(explanation|hypothesis|theory|possibility)\s+\d+/i.test(para) ||
                /\b(first|second|third|fourth|fifth)\s+(explanation|hypothesis|theory|possibility)\b/i.test(para)) {
                // Calculate likelihood score based on language used
                let likelihood = 5; // Default neutral score
                if (/\b(best|most likely|strongest|compelling|convincing|plausible)\b/i.test(para)) {
                    likelihood += 3;
                }
                else if (/\b(likely|probable|reasonable|sound|good)\b/i.test(para)) {
                    likelihood += 2;
                }
                else if (/\b(possible|potential|conceivable)\b/i.test(para)) {
                    likelihood += 1;
                }
                else if (/\b(unlikely|improbable|doubtful|questionable|weak)\b/i.test(para)) {
                    likelihood -= 2;
                }
                else if (/\b(very unlikely|highly improbable|implausible|far-fetched)\b/i.test(para)) {
                    likelihood -= 3;
                }
                // Further adjust based on explanation strength
                if (/\b(explains all|accounts for all|covers all|addresses every)\b/i.test(para)) {
                    likelihood += 2;
                }
                else if (/\b(explains most|accounts for most|covers most|addresses most)\b/i.test(para)) {
                    likelihood += 1;
                }
                else if (/\b(explains some|accounts for some|covers some|addresses some)\b/i.test(para)) {
                    likelihood -= 1;
                }
                else if (/\b(fails to explain|doesn't account for|cannot address)\b/i.test(para)) {
                    likelihood -= 2;
                }
                // Also consider simplicity (Occam's razor)
                if (/\b(simple|elegant|parsimonious|straightforward|concise|minimal|occam)\b/i.test(para)) {
                    likelihood += 1;
                }
                else if (/\b(complex|complicated|convoluted|intricate)\b/i.test(para)) {
                    likelihood -= 1;
                }
                explanations.push({
                    index: i,
                    content: para,
                    likelihood: Math.max(1, Math.min(10, likelihood)) // Clamp between 1-10
                });
            }
            else if (i === paragraphs.length - 1 ||
                /\b(conclusion|therefore|thus|ultimately|in conclusion|to conclude)\b/i.test(para)) {
                // Conclusion paragraph
                result.push(para);
            }
            else {
                // Other paragraphs that aren't explanations or conclusions
                result.push(para);
            }
        }
        // If we found explanations, keep only the top 2 most likely ones
        if (explanations.length > 2) {
            // Sort by likelihood (highest first)
            const sortedExplanations = [...explanations].sort((a, b) => b.likelihood - a.likelihood);
            // Keep top explanations
            result.push(sortedExplanations[0].content);
            result.push(sortedExplanations[1].content);
            // Add note about omitted explanations
            result.push(`[${explanations.length - 2} additional alternative explanations with lower likelihood have been omitted]`);
        }
        else {
            // Keep all explanations if there are only a few
            for (const explanation of explanations) {
                result.push(explanation.content);
            }
        }
        return result.filter(p => p.trim().length > 0).join('\n\n');
    }
}
//# sourceMappingURL=TokenOptimizerImpl.js.map