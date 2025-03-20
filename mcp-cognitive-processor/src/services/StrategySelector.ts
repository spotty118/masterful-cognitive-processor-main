/**
 * Production-ready strategy selector for the Masterful Cognitive Processor
 * This service dynamically selects the most appropriate thinking strategy based on problem characteristics
 */

import { mcpConfig } from '../config/mcp-config.js';
import { BaseThinkingStrategy } from '../strategies/BaseThinkingStrategy.js';
import { ThinkingModelStrategyFactory } from '../factories/ThinkingModelStrategyFactory.js';
import { IThinkingModelStrategy } from '../interfaces/IThinkingModelStrategy.js';

/**
 * StrategySelector provides intelligent selection of thinking strategies based on problem characteristics
 */
export class StrategySelector {
  private static instance: StrategySelector;
  private strategyCache: Map<string, string> = new Map();
  private strategyEffectiveness: Map<string, number> = new Map();
  
  private constructor() {
    // Initialize strategy effectiveness metrics
    const strategies = ['enhanced', 'strategic', 'tree_of_thoughts', 'chain_of_thought', 
                        'depth_first', 'breadth_first', 'standard', 'minimal'];
    
    strategies.forEach(strategy => {
      this.strategyEffectiveness.set(strategy, 0.8); // Starting baseline confidence
    });
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): StrategySelector {
    if (!StrategySelector.instance) {
      StrategySelector.instance = new StrategySelector();
    }
    return StrategySelector.instance;
  }
  
  /**
   * Select the best strategy for a given problem
   * @param problem The problem to solve
   * @returns The appropriate thinking strategy
   */
  public selectStrategy(problem: string): IThinkingModelStrategy {
    // Check if dynamic selection is enabled
    const dynamicEnabled = mcpConfig.core?.strategies?.dynamicSelection ?? true;
    
    if (!dynamicEnabled) {
      // Fall back to simple keyword-based selection
      return ThinkingModelStrategyFactory.getStrategy(this.simpleKeywordSelection(problem));
    }
    
    // Check for cached strategy decision
    const problemHash = this.hashString(problem);
    const cachedStrategy = this.strategyCache.get(problemHash);
    
    if (cachedStrategy) {
      return ThinkingModelStrategyFactory.getStrategy(cachedStrategy);
    }
    
    // Analyze problem characteristics
    const analysis = this.analyzeProblem(problem);
    
    // Determine appropriate strategy
    const selectedStrategy = this.determineStrategy(analysis);
    
    // Cache the decision for similar future problems
    this.strategyCache.set(problemHash, selectedStrategy);
    
    // Return the appropriate strategy instance
    return ThinkingModelStrategyFactory.getStrategy(selectedStrategy);
  }
  
  /**
   * Analyze problem to identify key characteristics
   * @private
   */
  private analyzeProblem(problem: string): {
    complexity: number;
    uncertainty: number;
    decisionBranches: number;
    sequentiality: number;
    abstractionLevel: number;
    domainSpecificity: number;
    structuredData: boolean;
  } {
    const problemLower = problem.toLowerCase();
    
    // Calculate complexity (0-1)
    const complexity = this.calculateComplexity(problemLower);
    
    // Calculate uncertainty (0-1)
    const uncertainty = this.calculateUncertainty(problemLower);
    
    // Calculate decision branches
    const decisionBranches = this.estimateDecisionBranches(problemLower);
    
    // Calculate sequentiality (how step-by-step the problem is)
    const sequentiality = this.calculateSequentiality(problemLower);
    
    // Calculate abstraction level (0-1)
    const abstractionLevel = this.calculateAbstractionLevel(problemLower);
    
    // Calculate domain specificity (0-1)
    const domainSpecificity = this.calculateDomainSpecificity(problemLower);
    
    // Determine if problem contains structured data
    const structuredData = this.containsStructuredData(problemLower);
    
    return {
      complexity,
      uncertainty,
      decisionBranches,
      sequentiality,
      abstractionLevel,
      domainSpecificity,
      structuredData
    };
  }
  
  /**
   * Determine the most appropriate strategy based on problem analysis
   * @private
   */
  private determineStrategy(analysis: {
    complexity: number;
    uncertainty: number;
    decisionBranches: number;
    sequentiality: number;
    abstractionLevel: number;
    domainSpecificity: number;
    structuredData: boolean;
  }): string {
    // Get preferred strategies from config if available
    const preferredStrategies = mcpConfig.core?.strategies?.preferredStrategies ?? {};
    
    // Decision logic based on problem characteristics
    if (analysis.uncertainty > 0.7 && analysis.complexity > 0.7) {
      return preferredStrategies.complex_decisions ?? 'enhanced';
    }
    
    if (analysis.decisionBranches > 3) {
      return preferredStrategies.multiple_options ?? 'tree_of_thoughts';
    }
    
    if (analysis.sequentiality > 0.7) {
      return preferredStrategies.step_by_step ?? 'chain_of_thought';
    }
    
    if (analysis.abstractionLevel > 0.7) {
      return preferredStrategies.design_problems ?? 'strategic';
    }
    
    if (analysis.complexity > 0.6 && analysis.decisionBranches <= 2) {
      return preferredStrategies.deep_analysis ?? 'depth_first';
    }
    
    if (analysis.decisionBranches > 1 && analysis.complexity > 0.4) {
      return preferredStrategies.option_exploration ?? 'breadth_first';
    }
    
    if (analysis.complexity > 0.3) {
      return preferredStrategies.general_problems ?? 'standard';
    }
    
    // Default to minimal for simple problems
    return preferredStrategies.simple_problems ?? 'minimal';
  }
  
  /**
   * Simple keyword-based strategy selection (fallback method)
   * @private
   */
  private simpleKeywordSelection(problem: string): string {
    const problemLower = problem.toLowerCase();
    
    // Enhanced strategy for complex decisions
    if (problemLower.includes('confidence') ||
        problemLower.includes('alternatives') ||
        problemLower.includes('trade-offs') ||
        problemLower.includes('analyze in detail') ||
        problemLower.includes('complex decision') ||
        problemLower.includes('multiple factors') ||
        problemLower.includes('uncertainty')) {
      return 'enhanced';
    }
    
    // Strategic for design/architecture problems
    if (problemLower.includes('architecture') ||
        problemLower.includes('design') ||
        problemLower.includes('system')) {
      return 'strategic';
    }
    
    // Depth-first for algorithm optimization
    if (problemLower.includes('algorithm') ||
        problemLower.includes('optimize') ||
        problemLower.includes('performance')) {
      return 'depth_first';
    }
    
    // Breadth-first for exploration
    if (problemLower.includes('explore') ||
        problemLower.includes('options')) {
      return 'breadth_first';
    }
    
    // Chain-of-thought for explanations
    if (problemLower.includes('explain') ||
        problemLower.includes('reasoning') ||
        problemLower.includes('step by step')) {
      return 'chain_of_thought';
    }
    
    // Tree-of-thoughts for multiple paths
    if (problemLower.includes('multiple paths') ||
        problemLower.includes('compare approaches')) {
      return 'tree_of_thoughts';
    }
    
    // Default to enhanced for better results
    return 'enhanced';
  }
  
  /**
   * Update effectiveness metrics for strategy selection
   * This should be called after processing is complete with success metrics
   */
  public updateStrategyEffectiveness(
    strategyName: string, 
    effectivenessScore: number
  ): void {
    // Get current effectiveness
    const currentScore = this.strategyEffectiveness.get(strategyName) ?? 0.8;
    
    // Update using exponential moving average (gives more weight to recent results)
    const alpha = 0.3; // Learning rate
    const newScore = (alpha * effectivenessScore) + ((1 - alpha) * currentScore);
    
    // Update strategy effectiveness map
    this.strategyEffectiveness.set(strategyName, newScore);
  }
  
  /**
   * Calculate complexity score based on multiple factors
   * @private
   */
  private calculateComplexity(text: string): number {
    // Word count complexity
    const words = text.split(/\s+/);
    const wordComplexity = Math.min(words.length / 200, 1);
    
    // Sentence complexity
    const sentences = text.split(/[.!?]+/);
    const avgWordsPerSentence = sentences.length > 0 ? 
      words.length / sentences.length : words.length;
    const sentenceComplexity = Math.min(avgWordsPerSentence / 20, 1);
    
    // Technical terms complexity
    const technicalTerms = [
      'algorithm', 'optimize', 'architecture', 'system', 'design pattern',
      'data structure', 'complexity', 'recursive', 'iteration', 'paradigm',
      'implementation', 'abstraction', 'interface', 'dependency', 'concurrent'
    ];
    
    const termMatches = technicalTerms.filter(term => text.includes(term)).length;
    const technicalComplexity = Math.min(termMatches / 5, 1);
    
    // Integrative complexity
    const integrativeMarkers = [
      'however', 'although', 'nevertheless', 'conversely', 'alternatively',
      'despite', 'whereas', 'while', 'instead', 'on the other hand',
      'trade-off', 'balance', 'compromise', 'integration'
    ];
    
    const integrativeMarkerCount = integrativeMarkers
      .filter(marker => text.includes(marker)).length;
    const integrativeComplexity = Math.min(integrativeMarkerCount / 3, 1);
    
    // Weighted average
    return (
      (wordComplexity * 0.1) +
      (sentenceComplexity * 0.2) +
      (technicalComplexity * 0.4) +
      (integrativeComplexity * 0.3)
    );
  }
  
  /**
   * Calculate uncertainty level in the problem
   * @private
   */
  private calculateUncertainty(text: string): number {
    const uncertaintyMarkers = [
      'uncertain', 'unclear', 'ambiguous', 'vague', 'maybe', 'perhaps',
      'might', 'could', 'possibly', 'probability', 'likelihood', 'chance',
      'risk', 'unknown', 'estimate', 'approximate', 'roughly', 'about'
    ];
    
    const confidenceMarkers = [
      'certainly', 'definitely', 'absolutely', 'clearly', 'obviously',
      'undoubtedly', 'precise', 'exact', 'specific', 'concrete', 'known'
    ];
    
    const uncertaintyScore = Math.min(
      uncertaintyMarkers.filter(marker => text.includes(marker)).length / 3,
      1
    );
    
    const confidenceScore = Math.min(
      confidenceMarkers.filter(marker => text.includes(marker)).length / 3,
      1
    );
    
    // Uncertainty is high when uncertainty markers are present and confidence markers are absent
    return Math.min(uncertaintyScore * (1 - (0.5 * confidenceScore)), 1);
  }
  
  /**
   * Estimate the number of decision branches in the problem
   * @private
   */
  private estimateDecisionBranches(text: string): number {
    const optionMarkers = [
      'options', 'alternatives', 'choices', 'approaches', 'methods',
      'techniques', 'strategies', 'paths', 'ways', 'routes'
    ];
    
    const listMarkers = [
      'first', 'second', 'third', 'fourth', 'fifth',
      'one', 'two', 'three', 'four', 'five',
      '1)', '2)', '3)', '4)', '5)',
      'a)', 'b)', 'c)', 'd)', 'e)'
    ];
    
    // Check for explicit mention of options
    for (const marker of optionMarkers) {
      if (text.includes(marker)) {
        // Look for numbers before the marker, e.g., "3 options"
        const matches = text.match(new RegExp(`(\\d+)\\s+${marker}`));
        if (matches && matches[1]) {
          return Math.min(parseInt(matches[1]), 10); // Cap at 10 branches
        }
      }
    }
    
    // Count list markers
    let listItems = 0;
    for (const marker of listMarkers) {
      if (text.includes(marker)) {
        listItems++;
      }
    }
    
    // Count bullet points
    const bulletPoints = (text.match(/[-•*]\\s+/g) || []).length;
    
    // Base decision branches on the evidence found
    if (listItems > 0 || bulletPoints > 0) {
      return Math.min(Math.max(listItems, bulletPoints), 10);
    }
    
    // For comparison problems, assume at least 2 branches
    if (text.includes('compare') || 
        text.includes('versus') || 
        text.includes('vs') || 
        text.includes('pros and cons')) {
      return 2;
    }
    
    // Default: if any option markers are present, assume at least 2 options
    return optionMarkers.some(marker => text.includes(marker)) ? 2 : 1;
  }
  
  /**
   * Calculate how sequential/step-by-step the problem is
   * @private
   */
  private calculateSequentiality(text: string): number {
    const sequentialMarkers = [
      'step', 'steps', 'sequence', 'sequential', 'process', 'procedure',
      'workflow', 'first', 'second', 'third', 'then', 'next', 'after',
      'before', 'finally', 'lastly', 'ultimately', 'subsequently'
    ];
    
    const markerCount = sequentialMarkers
      .filter(marker => text.includes(marker)).length;
    
    // Check for explicit "step by step" phrase
    const explicitStepByStep = text.includes('step by step') ? 0.7 : 0;
    
    // Check for numbered or ordered lists
    const numberedListPattern = /\d+\.\s+|\(\d+\)\s+|[a-z]\)\s+|first|second|third/i;
    const hasNumberedList = numberedListPattern.test(text) ? 0.6 : 0;
    
    // Combine the markers and explicit patterns
    return Math.min(
      (markerCount / 5) + explicitStepByStep + hasNumberedList,
      1
    );
  }
  
  /**
   * Calculate the abstraction level of the problem
   * @private
   */
  private calculateAbstractionLevel(text: string): number {
    const concreteTerms = [
      'specific', 'example', 'instance', 'code', 'implementation',
      'detail', 'concrete', 'actual', 'exact', 'precise', 'step'
    ];
    
    const abstractTerms = [
      'concept', 'abstract', 'general', 'high-level', 'principle',
      'theory', 'philosophical', 'conceptual', 'framework', 'paradigm',
      'architecture', 'strategy', 'approach'
    ];
    
    const concreteScore = Math.min(
      concreteTerms.filter(term => text.includes(term)).length / 3,
      1
    );
    
    const abstractScore = Math.min(
      abstractTerms.filter(term => text.includes(term)).length / 3,
      1
    );
    
    // High abstraction when abstract terms are present and concrete terms are absent
    return Math.min(abstractScore * (1 - (0.5 * concreteScore)), 1);
  }
  
  /**
   * Calculate domain specificity of the problem
   * @private
   */
  private calculateDomainSpecificity(text: string): number {
    const domains = [
      { name: 'web', terms: ['html', 'css', 'javascript', 'dom', 'browser', 'website'] },
      { name: 'database', terms: ['sql', 'database', 'query', 'table', 'record', 'index'] },
      { name: 'algorithm', terms: ['algorithm', 'complexity', 'search', 'sort', 'efficiency'] },
      { name: 'network', terms: ['network', 'tcp', 'http', 'protocol', 'packet', 'router'] },
      { name: 'security', terms: ['security', 'encryption', 'authentication', 'vulnerability'] },
      { name: 'mobile', terms: ['mobile', 'android', 'ios', 'app', 'responsive'] },
      { name: 'devops', terms: ['deployment', 'container', 'ci/cd', 'pipeline', 'kubernetes'] }
    ];
    
    // Calculate hits per domain
    const domainHits = domains.map(domain => {
      const hits = domain.terms.filter(term => text.includes(term)).length;
      return { name: domain.name, hits };
    });
    
    // Find the domain with the most hits
    const maxHitsDomain = domainHits.reduce(
      (max, domain) => domain.hits > max.hits ? domain : max,
      { name: '', hits: 0 }
    );
    
    // If we have significant hits in one domain, it's domain-specific
    if (maxHitsDomain.hits >= 2) {
      return Math.min(maxHitsDomain.hits / 4, 1);
    }
    
    // Check for general computer science terms that indicate some specificity
    const csTerms = [
      'code', 'program', 'function', 'class', 'object', 'method',
      'variable', 'data structure', 'library', 'api', 'framework'
    ];
    
    const csHits = csTerms.filter(term => text.includes(term)).length;
    
    return Math.min(csHits / 5, 0.6); // Cap at 0.6 for general CS terms
  }
  
  /**
   * Determine if the problem contains structured data
   * @private
   */
  private containsStructuredData(text: string): boolean {
    // Check for JSON-like structures
    const jsonPattern = /\{[^{}]*\}/;
    if (jsonPattern.test(text)) return true;
    
    // Check for array-like structures
    const arrayPattern = /\[[^\[\]]*\]/;
    if (arrayPattern.test(text)) return true;
    
    // Check for table-like structures
    const tablePattern = /\|\s*\w+\s*\|/;
    if (tablePattern.test(text)) return true;
    
    // Check for code blocks
    const codePattern = /```[\s\S]*```/;
    if (codePattern.test(text)) return true;
    
    return false;
  }
  
  /**
   * Generate a hash for a string for caching
   * @private
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }
}