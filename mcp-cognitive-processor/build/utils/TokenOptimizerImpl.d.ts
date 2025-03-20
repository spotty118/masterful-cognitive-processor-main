/**
 * Token Optimization Implementation
 */
import { OptimizationResult, OptimizationContext } from '../models/types.js';
import { ITokenOptimizer } from '../interfaces/ITokenOptimizer.js';
export declare class TokenOptimizerImpl implements ITokenOptimizer {
    private static instance;
    private initialized;
    private patternCache;
    private metricsHistory;
    private modelTokenRatios;
    private commonPatterns;
    private historyPath;
    private tokenHistory;
    private modelUsage;
    private tokenMetrics;
    private constructor();
    static getInstance(): TokenOptimizerImpl;
    init(): Promise<void>;
    /**
     * Optimize token usage for input text
     * This enhanced implementation provides more sophisticated optimization strategies
     * based on the content type, available tokens, and optimization context
     */
    optimizeTokenUsage(text: string, context?: OptimizationContext): OptimizationResult;
    private getDomainPatterns;
    private applyModelSpecificOptimizations;
    private removeRedundantPhrases;
    private simplifyComplexStructures;
    /**
     * Analyze the type of content to determine the best optimization strategy
     * @private
     */
    private analyzeContentType;
    /**
     * Detect the thinking strategy being used based on text content
     * @private
     */
    private detectThinkingStrategy;
    /**
     * Select the most appropriate optimization strategy based on content type, token constraints, and thinking strategy
     * @private
     */
    private selectOptimizationStrategy;
    /**
     * Calculate expected token savings based on the optimization strategy
     * @private
     */
    private calculateTokenSavings;
    /**
     * Extract key concepts from text for concept-based optimization with improved semantic understanding
     * @private
     */
    private extractKeyConcepts;
    /**
     * Detect the domain of the text for better optimization
     * @private
     */
    private detectDomain;
    /**
     * Estimate token count for text
     * This implementation uses a more sophisticated approach than just counting words
     * It considers:
     * 1. Word count (with a multiplier based on average token-per-word ratio)
     * 2. Character count (for languages with different tokenization patterns)
     * 3. Special character frequency (which often get their own tokens)
     * 4. Model-specific adjustments if provided
     */
    estimateTokenCount(text: string, model?: string): number;
    /**
     * Update metrics with actual token usage
     */
    updateTokenMetrics(problemId: string, estimatedTokens: number, actualTokens: number, model: string): void;
    /**
     * Get token optimization statistics
     */
    getTokenOptimizationStats(): {
        totalOptimizations: number;
        averageSavings: number;
        topPatterns: Array<{
            pattern: string;
            occurrences: number;
            averageSavings: number;
        }>;
    };
    /**
     * Perform maintenance on token history
     */
    performOptimizationMaintenance(): Promise<number>;
    /**
     * Load token history from disk
     */
    private loadTokenHistory;
    /**
     * Save token metrics to disk
     */
    private saveTokenMetrics;
    /**
     * Detect optimization pattern from metrics
     * This enhanced implementation uses configurable thresholds and more pattern categories
     */
    private detectPattern;
    /**
     * Generates suggested changes based on the optimization strategy
     * @private
     */
    private generateSuggestedChanges;
    /**
     * Extract domain-specific terms based on detected domain
     * @private
     */
    private extractDomainTerms;
    /**
     * Performs semantic compression on text to reduce token usage while preserving meaning
     * @private
     */
    private semanticCompress;
    /**
     * Splits text into logical sections for targeted transformations
     * @private
     */
    private splitIntoSections;
    /**
     * Applies length reduction using advanced text analysis
     * @private
     */
    private applyLengthReduction;
    /**
     * Creates a concise summary focused on key concepts
     * @private
     */
    private applyConciseConceptSummary;
    /**
     * Compresses chain of thought reasoning while maintaining logical flow
     * @private
     */
    private applyChainOfThoughtCompression;
    /**
     * Applies selective detail transformation based on importance
     * @private
     */
    private applySelectiveDetailTransform;
    /**
     * Prunes less relevant branches while maintaining tree structure
     * @private
     */
    private applyTreeBranchPruning;
    /**
     * Reduces tree branching factor while maintaining diversity
     * @private
     */
    private applyTreeBranchReduction;
    /**
     * Applies logical structure transformations for different reasoning types
     * @private
     */
    private applyLogicalStructureTransform;
    /**
     * Determines if a strategy involves text compression
     * @private
     */
    private isCompressionStrategy;
    /**
     * Determines compression level based on strategy
     * @private
     */
    private determineCompressionLevel;
    /**
     * Applies semantic compression with improved natural language understanding
     * @private
     */
    private applySemanticCompression;
    /**
     * Calculates sentence importance based on multiple factors
     * @private
     */
    private calculateSentenceImportance;
    /**
     * Applies general optimization techniques
     * @private
     */
    private applyGeneralOptimization;
    /**
     * Combines transformed sections while maintaining document coherence
     * @private
     */
    private combineTransformedSections;
    /**
     * Generates an optimized prompt using NLP transformations
     * @private
     */
    private generateOptimizedPrompt;
    /**
     * Simulates length reduction by removing redundant content
     * @private
     */
    private simulateLengthReduction;
    /**
     * Simulates concept extraction by focusing on key terms
     * @private
     */
    private simulateConceptExtraction;
    /**
     * Performs chain of thought compression by focusing on essential reasoning
     * @private
     */
    private simulateChainOfThoughtCompression;
    /**
     * Applies selective detail optimization to vary detail level across reasoning steps
     * @private
     */
    private simulateSelectiveDetail;
    /**
     * Simulates tree branch pruning by focusing on the most promising branches
     * @private
     */
    private simulateTreeBranchPruning;
    /**
     * Evaluates a branch's content to determine its promise/relevance
     * Higher scores indicate more promising branches
     * @private
     */
    private evaluateBranchContent;
    /**
     * Reduces branching factor in tree of thoughts
     * @private
     */
    private simulateTreeBranchReduction;
    /**
     * Applies reasoning system specific optimizations
     * @private
     */
    private simulateReasoningOptimization;
    /**
     * Optimizes deductive reasoning by focusing on crucial logical steps
     * @private
     */
    private optimizeDeductiveReasoning;
    /**
     * Optimizes inductive reasoning by selecting representative examples
     * @private
     */
    private optimizeInductiveReasoning;
    /**
     * Optimizes abductive reasoning by focusing on most likely explanations
     * @private
     */
    private optimizeAbductiveReasoning;
}
