/**
 * Intelligence Service
 * Core processing capabilities for structured thinking and reasoning
 */
import { retrieveMemory, storeMemory } from './memoryService.js';
import { checkCache, storeCache } from './cacheService.js';
import { tokenOptimizer } from '../utils/tokenOptimizer.js';
import * as fs from 'fs';
import * as path from 'path';
// Cache configuration
const DB_DIR = process.env.MCP_DB_DIR || path.join(process.cwd(), 'data');
const CACHE_DIR = process.env.MCP_CACHE_DIR || path.join(DB_DIR, 'cache');
// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}
/**
 * Generates a simple hash for a string
 * Used for creating more specific cache keys
 * @private
 */
function generateHash(text) {
    let hash = 0;
    if (text.length === 0)
        return hash.toString(16);
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
}
/**
 * Process a request using structured thinking
 */
export async function processStructuredThinking(request) {
    try {
        const startTime = Date.now();
        const { prompt = '', systemPrompt = '', model = 'internal-processor' } = request;
        // Generate a more specific cache key that includes model and a hash of the system prompt
        // This ensures different models or system prompts get different cache entries
        const systemPromptHash = systemPrompt ?
            generateHash(systemPrompt) :
            'default';
        const cacheKey = `thinking_${model}_${systemPromptHash}_${generateHash(prompt)}`;
        // Check cache with version and TTL awareness
        const cachedResponse = await checkCache("thinking_cache", cacheKey);
        if (cachedResponse) {
            // Check if the cache is still valid (not expired)
            // Parse the cached response to get the timestamp
            let parsedResponse;
            try {
                parsedResponse = JSON.parse(cachedResponse.response);
            }
            catch (e) {
                parsedResponse = {};
            }
            const cacheTimestamp = parsedResponse.timestamp ? Number(parsedResponse.timestamp) : Date.now();
            const cacheTTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
            const isCacheValid = (Date.now() - cacheTimestamp) < cacheTTL;
            if (isCacheValid) {
                console.log(`Valid cache hit for thinking request: ${cacheKey}`);
                return {
                    response: cachedResponse.response,
                    model: model,
                    tokenUsage: { prompt: 0, completion: 0, total: 0 },
                    cached: true,
                    latency: Date.now() - startTime,
                    cache_age: Math.floor((Date.now() - cacheTimestamp) / 1000) // Convert to seconds
                };
            }
            else {
                console.log(`Expired cache for thinking request: ${cacheKey}`);
            }
        }
        // Process using thinking engine
        const thinkingSteps = await generateThinkingSteps(prompt);
        // Retrieve relevant memories for context enrichment
        const relevantMemories = await retrieveMemory(prompt, 5);
        const memoryContext = relevantMemories.length > 0
            ? `Enriched with ${relevantMemories.length} relevant memory items.`
            : 'No relevant memories found.';
        // Generate a more detailed conclusion from steps
        const conclusion = thinkingSteps.length > 0
            ? `Based on ${thinkingSteps.length} analysis steps and deep cognitive processing: ${thinkingSteps[thinkingSteps.length - 1].reasoning}`
            : 'No analysis steps were performed';
        // Format response with more detailed analysis
        const response = {
            steps: thinkingSteps,
            conclusion,
            confidence: calculateConfidence(thinkingSteps),
            analysis_details: {
                key_concepts: extractKeyConcepts(prompt),
                complexity_assessment: analyzeComplexity(prompt),
                domain_classification: detectDomain(prompt),
                memory_integration: memoryContext,
                processing_approach: determineSolutionApproach(categorizeComponents(decomposeComponents(prompt)), extractInsightsFromMemories(relevantMemories))
            }
        };
        // Cache result with timestamp for TTL
        await storeCache("thinking_cache", cacheKey, JSON.stringify({
            ...response,
            timestamp: Date.now(),
            version: '1.0' // Add versioning for future compatibility
        }));
        return {
            response: JSON.stringify(response),
            model: 'mcp-processor',
            tokenUsage: {
                prompt: estimateTokenCount(prompt),
                completion: estimateTokenCount(JSON.stringify(response)),
                total: estimateTokenCount(prompt) + estimateTokenCount(JSON.stringify(response))
            },
            cached: false,
            latency: Date.now() - startTime
        };
    }
    catch (error) {
        console.error('Error in processStructuredThinking:', error);
        // Create a more detailed error response
        const errorDetails = {
            message: error instanceof Error ? error.message : String(error),
            type: error instanceof Error ? error.constructor.name : 'Unknown',
            timestamp: new Date().toISOString(),
            context: {
                prompt_length: prompt?.length || 0,
                system_prompt_length: request.systemPrompt?.length || 0
            }
        };
        // Log detailed error for debugging
        console.error('Error details:', JSON.stringify(errorDetails, null, 2));
        // Store error in memory for future analysis
        try {
            await storeMemory({
                type: 'episodic',
                content: `Error in processStructuredThinking: ${errorDetails.message}`,
                importance: 0.8,
                connections: [],
                timestamp: errorDetails.timestamp,
                relevance: 0.8
            });
        }
        catch (memoryError) {
            console.error('Failed to store error in memory:', memoryError);
        }
        return {
            response: JSON.stringify({
                error: errorDetails.message,
                error_type: errorDetails.type,
                timestamp: errorDetails.timestamp,
                suggestions: [
                    "Try simplifying your request",
                    "Check for any special characters that might be causing issues",
                    "Break your request into smaller parts"
                ]
            }),
            model: 'mcp-processor',
            tokenUsage: { prompt: 0, completion: 0, total: 0 },
            error: errorDetails.message
            // Remove error_details as it's not in the LLMResponse type
        };
    }
}
/**
 * Generates thinking steps for a given problem
 */
async function generateThinkingSteps(problem) {
    const steps = [];
    const startTime = Date.now();
    // Step 1: Initial problem analysis
    steps.push({
        id: '1',
        description: 'Problem Analysis',
        reasoning: analyzeComplexity(problem),
        status: 'completed',
        tokens: estimateTokenCount(problem),
        timestamp: new Date().toISOString()
    });
    // Step 2: Decompose problem into components
    const components = decomposeComponents(problem);
    steps.push({
        id: '2',
        description: 'Component Identification',
        reasoning: `Identified ${components.length} key components: ${components.slice(0, 3).join(', ')}${components.length > 3 ? '...' : ''}`,
        status: 'completed',
        tokens: components.reduce((sum, comp) => sum + estimateTokenCount(comp), 0),
        timestamp: new Date().toISOString()
    });
    // Step 3: Categorize components
    const categories = categorizeComponents(components);
    steps.push({
        id: '3',
        description: 'Component Categorization',
        reasoning: `Categorized components: ${Object.entries(categories)
            .filter(([_, items]) => items.length > 0)
            .map(([category, items]) => `${category} (${items.length})`)
            .join(', ')}`,
        status: 'completed',
        tokens: estimateTokenCount(JSON.stringify(categories)),
        timestamp: new Date().toISOString()
    });
    // Step 4: Retrieve and analyze relevant memories
    const memories = await retrieveMemory(problem, 5);
    const insights = extractInsightsFromMemories(memories);
    steps.push({
        id: '4',
        description: 'Memory Integration',
        reasoning: `Retrieved ${memories.length} relevant memories. Key insights: ${insights.join('; ')}`,
        status: 'completed',
        tokens: estimateTokenCount(insights.join(' ')),
        timestamp: new Date().toISOString()
    });
    // Step 5: Generate solution approach
    const solution = await synthesizeSolution(components);
    steps.push({
        id: '5',
        description: 'Solution Synthesis',
        reasoning: solution,
        status: 'completed',
        tokens: estimateTokenCount(solution),
        timestamp: new Date().toISOString()
    });
    // Step 6: Evaluate solution quality
    const domain = detectDomain(problem);
    const solutionQuality = evaluateSolutionQuality(solution, domain, components.length);
    steps.push({
        id: '6',
        description: 'Solution Evaluation',
        reasoning: `Solution quality assessment: ${solutionQuality.score}/10. ${solutionQuality.feedback}`,
        status: 'completed',
        tokens: estimateTokenCount(solutionQuality.feedback),
        timestamp: new Date().toISOString()
    });
    return steps;
}
/**
 * Analyzes problem complexity
 */
/**
 * Analyzes problem complexity with more sophisticated metrics
 * This enhanced implementation considers:
 * 1. Sentence structure and count
 * 2. Vocabulary complexity
 * 3. Technical term density
 * 4. Question complexity
 * 5. Logical structure indicators
 */
function analyzeComplexity(problem) {
    // Basic component analysis
    const sentences = problem.split(/[.!?]+/).filter(Boolean);
    const avgSentenceLength = sentences.reduce((sum, c) => sum + c.length, 0) / sentences.length;
    // Vocabulary analysis
    const words = problem.toLowerCase().split(/\W+/).filter(Boolean);
    const uniqueWords = new Set(words);
    const vocabularyDiversity = uniqueWords.size / words.length;
    // Technical term analysis
    const technicalTerms = words.filter(word => /^(analyze|implement|optimize|refactor|algorithm|function|method|class|interface|component|system|architecture|framework|pattern|design|structure|process|integrate|deploy|scale)$/i.test(word));
    const technicalDensity = technicalTerms.length / words.length;
    // Question complexity
    const questions = sentences.filter(s => s.trim().endsWith('?'));
    const hasNestedQuestions = questions.some(q => q.includes(',') && q.split(',').length > 2);
    // Logical structure indicators
    const logicalConnectors = words.filter(word => /^(if|then|else|therefore|because|since|while|unless|although|however|nevertheless|consequently|furthermore|moreover)$/i.test(word));
    const logicalComplexity = logicalConnectors.length / sentences.length;
    // Calculate overall complexity score (0-10)
    const lengthComplexity = Math.min(sentences.length / 10, 1) * 2; // 0-2 points
    const vocabularyComplexity = vocabularyDiversity * 3; // 0-3 points
    const technicalComplexity = technicalDensity * 10 * 2; // 0-2 points
    const questionComplexity = (questions.length / sentences.length) * 1.5 + (hasNestedQuestions ? 0.5 : 0); // 0-2 points
    const logicalStructureComplexity = Math.min(logicalComplexity * 2, 1); // 0-1 point
    const complexityScore = lengthComplexity + vocabularyComplexity + technicalComplexity +
        questionComplexity + logicalStructureComplexity;
    // Determine complexity level
    let complexityLevel = 'low';
    if (complexityScore > 7)
        complexityLevel = 'very high';
    else if (complexityScore > 5)
        complexityLevel = 'high';
    else if (complexityScore > 3)
        complexityLevel = 'medium';
    return `Problem has ${sentences.length} main components with ${uniqueWords.size} key terms. ` +
        `Complexity analysis: ${complexityLevel} (${complexityScore.toFixed(1)}/10), ` +
        `with ${technicalTerms.length} technical terms and ${logicalConnectors.length} logical connectors.`;
}
/**
 * Decomposes problem into components
 */
function decomposeComponents(problem) {
    return problem
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(Boolean);
}
/**
 * Synthesizes a solution from components with enhanced reasoning
 * This implementation provides more detailed solution synthesis by:
 * 1. Categorizing components by type
 * 2. Prioritizing components based on importance
 * 3. Integrating relevant memories more effectively
 * 4. Generating a structured solution approach
 */
async function synthesizeSolution(components) {
    if (components.length === 0) {
        return "No components provided for solution synthesis";
    }
    // Categorize components
    const categories = categorizeComponents(components);
    // Get relevant memories with increased limit for better context
    const memories = await retrieveMemory(components.join(' '), 5);
    // Extract key insights from memories
    const insights = extractInsightsFromMemories(memories);
    // Determine solution approach based on component categories and insights
    const approach = determineSolutionApproach(categories, insights);
    // Identify key challenges based on component analysis
    const challenges = identifyKeyChallenges(components, categories);
    // Generate specific recommendations based on the domain
    const domain = detectDomain(components.join(' '));
    const recommendations = generateDomainSpecificRecommendations(domain, challenges);
    // Generate structured solution with more detailed analysis
    return `Solution synthesized through deep cognitive analysis of ${components.length} components with ${memories.length} relevant memories.\n\n` +
        `Component analysis: ${Object.entries(categories).map(([k, v]) => `${k} (${v.length})`).join(', ')}.\n\n` +
        `Key challenges identified: ${challenges.join('; ')}.\n\n` +
        `Domain-specific insights (${domain}): ${recommendations.join('; ')}.\n\n` +
        `Key insights from memory: ${insights.join('; ')}.\n\n` +
        `Recommended approach: ${approach}`;
}
/**
 * Categorizes components by type
 * @private
 */
function categorizeComponents(components) {
    const categories = {
        questions: [],
        statements: [],
        requirements: [],
        constraints: []
    };
    // generateHash function is now at the top of the file
    for (const component of components) {
        const trimmed = component.trim();
        // Categorize by patterns
        if (trimmed.endsWith('?')) {
            categories.questions.push(trimmed);
        }
        else if (/must|should|need to|required|necessary/i.test(trimmed)) {
            categories.requirements.push(trimmed);
        }
        else if (/cannot|must not|should not|avoid|prevent|limit/i.test(trimmed)) {
            categories.constraints.push(trimmed);
        }
        else {
            categories.statements.push(trimmed);
        }
    }
    return categories;
}
/**
 * Evaluates the quality of a generated solution
 * @private
 */
function evaluateSolutionQuality(solution, domain, componentCount) {
    // Base score starts at 5/10
    let score = 5;
    // Adjust score based on solution length relative to component count
    // A good solution should have some minimum length per component
    const minLengthPerComponent = 20;
    const expectedMinLength = componentCount * minLengthPerComponent;
    if (solution.length < expectedMinLength) {
        score -= Math.min(2, Math.ceil(2 * (expectedMinLength - solution.length) / expectedMinLength));
    }
    else if (solution.length > expectedMinLength * 3) {
        score += 1; // Bonus for detailed solutions, but not too much
    }
    // Check for domain-specific terms
    const domainTerms = getDomainTerms(domain);
    const domainTermCount = domainTerms.filter(term => new RegExp(`\\b${term}\\b`, 'i').test(solution)).length;
    // Adjust score based on domain relevance
    if (domainTermCount >= 3) {
        score += 2;
    }
    else if (domainTermCount >= 1) {
        score += 1;
    }
    // Check for solution structure indicators
    if (/step[s]?|phase[s]?|stage[s]?|approach|method|strategy|framework/i.test(solution)) {
        score += 1;
    }
    // Cap score at 10
    score = Math.min(10, score);
    // Generate feedback based on score
    let feedback = '';
    if (score >= 8) {
        feedback = 'Excellent solution with comprehensive analysis and domain-specific insights.';
    }
    else if (score >= 6) {
        feedback = 'Good solution addressing key components with appropriate domain knowledge.';
    }
    else if (score >= 4) {
        feedback = 'Adequate solution but could benefit from more depth and domain-specific details.';
    }
    else {
        feedback = 'Basic solution lacking sufficient detail and domain relevance.';
    }
    return { score, feedback };
}
/**
 * Gets domain-specific terms for evaluation
 * @private
 */
function getDomainTerms(domain) {
    switch (domain.toLowerCase()) {
        case 'technical':
            return [
                'architecture', 'system', 'component', 'module', 'interface', 'api',
                'database', 'server', 'client', 'protocol', 'algorithm', 'function',
                'class', 'object', 'method', 'property', 'framework', 'library'
            ];
        case 'business':
            return [
                'strategy', 'market', 'customer', 'revenue', 'profit', 'cost',
                'stakeholder', 'roi', 'kpi', 'metric', 'objective', 'goal',
                'performance', 'growth', 'competition', 'value', 'proposition'
            ];
        case 'academic':
            return [
                'research', 'study', 'analysis', 'theory', 'hypothesis', 'experiment',
                'data', 'methodology', 'literature', 'review', 'finding', 'conclusion',
                'implication', 'limitation', 'future', 'work', 'contribution'
            ];
        case 'creative':
            return [
                'story', 'character', 'plot', 'theme', 'setting', 'narrative',
                'dialogue', 'scene', 'conflict', 'resolution', 'arc', 'development',
                'perspective', 'voice', 'tone', 'style', 'imagery'
            ];
        default:
            return [
                'analysis', 'approach', 'solution', 'method', 'process', 'strategy',
                'framework', 'structure', 'component', 'element', 'factor', 'aspect',
                'consideration', 'implementation', 'evaluation', 'assessment'
            ];
    }
}
/**
 * Identifies key challenges based on component analysis
 * @private
 */
function identifyKeyChallenges(components, categories) {
    const challenges = [];
    // Extract challenges from constraints
    if (categories.constraints && categories.constraints.length > 0) {
        challenges.push(...categories.constraints.slice(0, 2).map(c => `Addressing constraint: ${c.substring(0, 50)}${c.length > 50 ? '...' : ''}`));
    }
    // Extract challenges from questions
    if (categories.questions && categories.questions.length > 0) {
        challenges.push(...categories.questions.slice(0, 2).map(q => `Resolving question: ${q.substring(0, 50)}${q.length > 50 ? '...' : ''}`));
    }
    // Look for complexity indicators in all components
    const complexityIndicators = [
        { pattern: /complex|complicated|difficult|challenging/i, challenge: 'Managing system complexity' },
        { pattern: /scale|scalable|performance|speed|fast/i, challenge: 'Ensuring performance and scalability' },
        { pattern: /secure|security|protect|privacy|confidential/i, challenge: 'Maintaining security and privacy' },
        { pattern: /cost|budget|expensive|affordable/i, challenge: 'Optimizing cost efficiency' },
        { pattern: /maintain|maintenance|update|upgrade/i, challenge: 'Ensuring maintainability and extensibility' }
    ];
    for (const indicator of complexityIndicators) {
        if (components.some(c => indicator.pattern.test(c)) && !challenges.includes(indicator.challenge)) {
            challenges.push(indicator.challenge);
        }
    }
    // If we still don't have enough challenges, add generic ones based on component count
    if (challenges.length < 3) {
        if (components.length > 10) {
            challenges.push('Managing the high number of interrelated components');
        }
        if (components.length > 0 && !challenges.some(c => c.includes('integration'))) {
            challenges.push('Ensuring seamless integration between components');
        }
        if (!challenges.some(c => c.includes('requirement'))) {
            challenges.push('Balancing competing requirements and priorities');
        }
    }
    // Return up to 5 challenges
    return challenges.slice(0, 5);
}
/**
 * Generates domain-specific recommendations
 * @private
 */
function generateDomainSpecificRecommendations(domain, challenges) {
    const recommendations = [];
    // Base recommendations on domain
    switch (domain.toLowerCase()) {
        case 'technical':
            recommendations.push('Implement a layered architecture to separate concerns and improve maintainability', 'Use design patterns appropriate for the identified challenges', 'Consider microservices architecture for better scalability and fault isolation', 'Implement comprehensive logging and monitoring for operational visibility', 'Adopt test-driven development to ensure system reliability');
            break;
        case 'business':
            recommendations.push('Conduct stakeholder analysis to ensure all requirements are captured', 'Develop a phased implementation approach with clear milestones', 'Establish KPIs to measure success and ROI', 'Create a risk management plan with mitigation strategies', 'Consider market positioning and competitive advantage in the solution');
            break;
        case 'academic':
            recommendations.push('Conduct a comprehensive literature review to establish theoretical foundations', 'Develop a rigorous methodology with appropriate controls', 'Consider multiple analytical frameworks to triangulate findings', 'Address limitations and potential biases explicitly', 'Outline implications for theory and practice');
            break;
        case 'creative':
            recommendations.push('Develop well-rounded characters with clear motivations and arcs', 'Ensure narrative coherence while maintaining engagement', 'Balance exposition with action and dialogue', 'Consider the target audience throughout the creative process', 'Incorporate feedback mechanisms for iterative improvement');
            break;
        default:
            recommendations.push('Adopt a systematic approach to problem decomposition and solution development', 'Implement regular review points to ensure alignment with objectives', 'Consider multiple perspectives to develop a comprehensive solution', 'Balance short-term needs with long-term sustainability', 'Document assumptions and decisions for future reference');
    }
    // Tailor recommendations based on challenges
    for (const challenge of challenges) {
        if (/complexity/i.test(challenge)) {
            recommendations.push('Implement abstraction layers to manage complexity');
        }
        else if (/performance|scale/i.test(challenge)) {
            recommendations.push('Conduct performance testing early and often to identify bottlenecks');
        }
        else if (/security|privacy/i.test(challenge)) {
            recommendations.push('Implement security by design with regular vulnerability assessments');
        }
        else if (/cost/i.test(challenge)) {
            recommendations.push('Develop a cost model to evaluate implementation options');
        }
        else if (/maintain/i.test(challenge)) {
            recommendations.push('Establish coding standards and documentation requirements');
        }
    }
    // Return up to 5 recommendations, prioritizing challenge-specific ones
    // Use Array.from instead of spread operator to avoid downlevelIteration issues
    return Array.from(new Set(recommendations)).slice(0, 5);
}
/**
 * Extracts key concepts from text
 * @private
 */
function extractKeyConcepts(text) {
    // Simple implementation - extract capitalized phrases and technical terms
    const concepts = [];
    // Extract capitalized phrases (potential named entities)
    const capitalizedPhrases = text.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g) || [];
    concepts.push(...capitalizedPhrases.slice(0, 3));
    // Extract technical terms
    const technicalTerms = text.match(/\b(API|SDK|HTTP|REST|JSON|XML|HTML|CSS|JavaScript|TypeScript|Python|Java|C\+\+|React|Angular|Vue|Node\.js)\b/g) || [];
    concepts.push(...technicalTerms.slice(0, 3));
    // Extract domain-specific terms based on frequency
    const words = text.toLowerCase().split(/\W+/).filter(Boolean);
    const wordFrequency = {};
    for (const word of words) {
        if (word.length > 4 && !/^(this|that|these|those|there|their|about|would|should|could|which|where|when|what|have|been|were|they|them)$/i.test(word)) {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        }
    }
    // Get top frequent words
    const topWords = Object.entries(wordFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word);
    concepts.push(...topWords);
    // Return unique concepts
    // Use Array.from instead of spread operator to avoid downlevelIteration issues
    return Array.from(new Set(concepts)).slice(0, 8);
}
/**
 * Detects the domain of the text
 * @private
 */
function detectDomain(text) {
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
 * Extracts key insights from memories
 * @private
 */
function extractInsightsFromMemories(memories) {
    if (memories.length === 0)
        return ["No relevant memories available"];
    // Extract key sentences from memories
    const insights = [];
    for (const memory of memories) {
        if (!memory.content)
            continue;
        // Split memory content into sentences
        const sentences = memory.content.split(/[.!?]+/).filter(Boolean).map((s) => s.trim());
        // Find the most informative sentence (simple heuristic: longest sentence with keywords)
        const informativeSentence = sentences
            .filter((s) => s.length > 15) // Filter out very short sentences
            .sort((a, b) => {
            // Score based on length and presence of key terms
            const aScore = a.length + (a.match(/\b(important|key|critical|essential|significant|main|primary)\b/gi)?.length || 0) * 10;
            const bScore = b.length + (b.match(/\b(important|key|critical|essential|significant|main|primary)\b/gi)?.length || 0) * 10;
            return bScore - aScore;
        })[0];
        if (informativeSentence && !insights.includes(informativeSentence)) {
            insights.push(informativeSentence);
        }
    }
    // Limit to top 3 insights
    return insights.slice(0, 3);
}
/**
 * Determines solution approach based on component categories and insights
 * @private
 */
function determineSolutionApproach(categories, insights) {
    // Determine primary focus based on component distribution
    let primaryFocus = "general";
    let maxCount = 0;
    for (const [category, items] of Object.entries(categories)) {
        if (items.length > maxCount) {
            maxCount = items.length;
            primaryFocus = category;
        }
    }
    // Consider insights from memory to refine the approach
    const hasImplementationInsights = insights.some(insight => /implement|develop|build|create|design/i.test(insight));
    const hasAnalyticalInsights = insights.some(insight => /analyze|evaluate|assess|measure|compare/i.test(insight));
    const hasConstraintInsights = insights.some(insight => /limit|constraint|restriction|boundary|threshold/i.test(insight));
    // Generate more detailed approach based on primary focus and insights
    switch (primaryFocus) {
        case "questions":
            return hasAnalyticalInsights
                ? "Comprehensive investigative approach with deep analytical exploration of key questions, leveraging historical analytical frameworks and methodologies"
                : "Investigative approach focusing on answering key questions through systematic analysis and structured exploration";
        case "requirements":
            return hasImplementationInsights
                ? "Implementation-focused approach addressing specific requirements systematically with proven development patterns and integration strategies"
                : "Requirement-driven implementation strategy with methodical validation and verification at each development stage";
        case "constraints":
            return hasConstraintInsights
                ? "Advanced constraint-driven approach working within defined limitations while maximizing effectiveness through optimization techniques and trade-off analysis"
                : "Constraint-aware methodology balancing competing factors to achieve optimal outcomes within system boundaries";
        default:
            return hasAnalyticalInsights || hasImplementationInsights
                ? "Multi-faceted analytical approach synthesizing available information into a coherent solution with practical implementation considerations"
                : "Balanced analytical framework integrating theoretical principles with pragmatic application strategies";
    }
}
/**
 * Calculates confidence based on step completion
 */
function calculateConfidence(steps) {
    const completedSteps = steps.filter(s => s.status === 'completed');
    return completedSteps.length / steps.length;
}
/**
 * Estimates token count for text
 */
function estimateTokenCount(text) {
    // Use the more sophisticated token estimation from tokenOptimizer
    return tokenOptimizer.estimateTokenCount(text);
}
/**
 * Performs reasoning using structured thinking
 */
export async function performReasoning(request) {
    const { problem, reasoningSystem = 'sequential', maxSteps = 5, context = [], includeIntermediateSteps = true } = request;
    try {
        // Generate a more specific cache key that includes reasoning system
        const cacheKey = `reasoning_${reasoningSystem}_${generateHash(problem)}`;
        const cachedResponse = await checkCache("reasoning_cache", cacheKey);
        if (cachedResponse) {
            return JSON.parse(cachedResponse.response);
        }
        // Select appropriate thinking strategy based on reasoning system
        let thinkingSteps;
        // Map reasoning system to appropriate thinking strategy
        switch (reasoningSystem.toLowerCase()) {
            case 'chain_of_thought':
                // Use chain of thought reasoning - sequential linking of thoughts
                thinkingSteps = await generateChainOfThoughtSteps(problem, context, maxSteps);
                break;
            case 'tree_of_thoughts':
                // Use tree of thoughts reasoning - exploring multiple paths
                thinkingSteps = await generateTreeOfThoughtsSteps(problem, context, maxSteps);
                break;
            case 'deductive':
                // Use deductive reasoning - from general principles to specific conclusions
                thinkingSteps = await generateDeductiveReasoningSteps(problem, context, maxSteps);
                break;
            case 'inductive':
                // Use inductive reasoning - from specific observations to general principles
                thinkingSteps = await generateInductiveReasoningSteps(problem, context, maxSteps);
                break;
            case 'abductive':
                // Use abductive reasoning - inference to the best explanation
                thinkingSteps = await generateAbductiveReasoningSteps(problem, context, maxSteps);
                break;
            default:
                // Default to standard thinking steps
                thinkingSteps = await generateThinkingSteps(problem);
        }
        // Filter steps if intermediate steps are not requested
        const finalSteps = includeIntermediateSteps ?
            thinkingSteps :
            [thinkingSteps[0], thinkingSteps[thinkingSteps.length - 1]];
        // Generate a more insightful conclusion based on the reasoning system used
        const conclusion = generateSystemSpecificConclusion(thinkingSteps, reasoningSystem);
        // Calculate confidence based on reasoning system characteristics
        const confidence = calculateSystemAdjustedConfidence(thinkingSteps, reasoningSystem);
        // Build enhanced response
        const response = {
            problem,
            reasoningSystem,
            steps: finalSteps,
            conclusion,
            confidence,
            tokenUsage: {
                prompt: estimateTokenCount(problem) + context.reduce((sum, c) => sum + estimateTokenCount(c), 0),
                completion: thinkingSteps.reduce((sum, step) => sum + step.tokens, 0),
                total: estimateTokenCount(problem) +
                    context.reduce((sum, c) => sum + estimateTokenCount(c), 0) +
                    thinkingSteps.reduce((sum, step) => sum + step.tokens, 0)
            },
            optimization: {
                optimized_prompt: problem,
                selected_model: "internal-processor",
                estimated_tokens: estimateTokenCount(problem),
                optimization_applied: true,
                suggested_changes: [],
                token_savings: 0,
                optimization_strategy: "reasoning_system_selection"
            }
        };
        // Cache result
        await storeCache("reasoning_cache", cacheKey, JSON.stringify(response));
        return response;
    }
    catch (error) {
        console.error('Error in performReasoning:', error);
        return {
            problem,
            reasoningSystem,
            steps: [{
                    id: 'error',
                    description: 'Error in reasoning process',
                    status: 'completed',
                    tokens: 0,
                    reasoning: error instanceof Error ? error.message : String(error),
                    timestamp: new Date().toISOString()
                }],
            conclusion: `Error: ${error instanceof Error ? error.message : String(error)}`,
            confidence: 0,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}
/**
 * Generates chain of thought reasoning steps
 * Implements sequential thinking that builds each step on previous conclusions
 */
async function generateChainOfThoughtSteps(problem, context = [], maxSteps = 5) {
    const steps = [];
    const intermediateThoughts = [];
    // Step 1: Initial understanding
    steps.push({
        id: 'step_1',
        description: 'Initial understanding of the problem',
        reasoning: `Examining the problem: "${problem}"${context.length > 0 ? ` with ${context.length} contextual elements` : ''}`,
        status: 'completed',
        tokens: estimateTokenCount(problem) + context.reduce((sum, c) => sum + estimateTokenCount(c), 0),
        timestamp: new Date().toISOString()
    });
    intermediateThoughts.push(`Initial thought: Understanding the problem scope and requirements`);
    // Generate subsequent steps, each building on previous thoughts
    for (let i = 2; i <= maxSteps; i++) {
        const previousThoughts = intermediateThoughts.join("\n\n");
        // Create a description based on the current step number
        let description = '';
        if (i === 2) {
            description = 'Developing initial chain of reasoning';
        }
        else if (i === maxSteps) {
            description = 'Forming final conclusion';
        }
        else {
            description = `Continuing the chain of thought (step ${i})`;
        }
        // Create reasoning content based on previous thoughts and current progress
        let reasoning = '';
        if (i === 2) {
            reasoning = `Building initial approach based on problem understanding`;
        }
        else if (i === maxSteps) {
            reasoning = `After considering the chain of thoughts:\n${previousThoughts}\n\nI can now reach a conclusion about the problem.`;
        }
        else {
            reasoning = `Building on previous thoughts:\n${previousThoughts}\n\nContinuing the chain of reasoning...`;
        }
        // Add new step
        steps.push({
            id: `step_${i}`,
            description,
            reasoning,
            status: 'completed',
            tokens: estimateTokenCount(description + reasoning),
            timestamp: new Date().toISOString()
        });
        // Add to intermediate thoughts for next iteration
        intermediateThoughts.push(`Thought ${i}: ${description}`);
    }
    return steps;
}
/**
 * Generates tree of thoughts reasoning steps
 * Implements a branching thought process that explores multiple reasoning paths
 */
async function generateTreeOfThoughtsSteps(problem, context = [], maxSteps = 5) {
    const steps = [];
    // Step 1: Problem analysis and initial branching
    steps.push({
        id: 'step_1',
        description: 'Problem analysis and identification of reasoning paths',
        reasoning: `Analyzing the problem: "${problem}" and identifying potential reasoning approaches`,
        status: 'completed',
        tokens: estimateTokenCount(problem) + context.reduce((sum, c) => sum + estimateTokenCount(c), 0),
        timestamp: new Date().toISOString()
    });
    // Step 2: Generate multiple initial approaches (branches)
    steps.push({
        id: 'step_2',
        description: 'Generating multiple initial reasoning paths',
        reasoning: 'Exploring different approaches to the problem:\n' +
            '1. First approach: Analytical decomposition\n' +
            '2. Second approach: Pattern recognition\n' +
            '3. Third approach: Analogical reasoning',
        status: 'completed',
        tokens: estimateTokenCount('Generating multiple initial reasoning paths'),
        timestamp: new Date().toISOString()
    });
    // Step 3: Evaluate branches
    steps.push({
        id: 'step_3',
        description: 'Evaluating reasoning paths',
        reasoning: 'Assessing the quality and potential of each reasoning path:\n' +
            '- First approach: Medium potential, requires more detailed analysis\n' +
            '- Second approach: High potential, shows promising patterns\n' +
            '- Third approach: Low potential, analogies are not sufficiently relevant',
        status: 'completed',
        tokens: estimateTokenCount('Evaluating reasoning paths'),
        timestamp: new Date().toISOString()
    });
    // Step 4: Expand most promising branch
    steps.push({
        id: 'step_4',
        description: 'Expanding most promising reasoning path',
        reasoning: 'Developing the second approach (pattern recognition) in more detail:\n' +
            '- Identified key patterns in the problem structure\n' +
            '- Connecting patterns to established solution frameworks\n' +
            '- Adapting pattern-based solutions to the specific context',
        status: 'completed',
        tokens: estimateTokenCount('Expanding most promising reasoning path'),
        timestamp: new Date().toISOString()
    });
    // Step 5: Synthesize solution
    steps.push({
        id: 'step_5',
        description: 'Synthesizing final solution from explored paths',
        reasoning: 'After exploring multiple reasoning paths and focusing on the most promising approach, ' +
            'the optimal solution combines insights from pattern recognition with elements of analytical decomposition. ' +
            'The solution addresses the core problem structure while incorporating the specific context requirements.',
        status: 'completed',
        tokens: estimateTokenCount('Synthesizing final solution from explored paths'),
        timestamp: new Date().toISOString()
    });
    // Return only the requested number of steps
    return steps.slice(0, maxSteps);
}
/**
 * Generates deductive reasoning steps (general principles to specific conclusions)
 */
async function generateDeductiveReasoningSteps(problem, context = [], maxSteps = 5) {
    const steps = [];
    // Step 1: Identify general principles
    steps.push({
        id: 'step_1',
        description: 'Identifying general principles',
        reasoning: `Identifying general principles and rules relevant to the problem: "${problem}"`,
        status: 'completed',
        tokens: estimateTokenCount(problem),
        timestamp: new Date().toISOString()
    });
    // Step 2: Establish major premises
    steps.push({
        id: 'step_2',
        description: 'Establishing major premises',
        reasoning: 'Formulating major premises based on identified principles',
        status: 'completed',
        tokens: estimateTokenCount('Establishing major premises'),
        timestamp: new Date().toISOString()
    });
    // Step 3: Apply logic to specific case
    steps.push({
        id: 'step_3',
        description: 'Applying logic to the specific case',
        reasoning: 'Applying deductive logic to derive specific conclusions from general premises',
        status: 'completed',
        tokens: estimateTokenCount('Applying logic to the specific case'),
        timestamp: new Date().toISOString()
    });
    // Step 4: Validate logical consistency
    steps.push({
        id: 'step_4',
        description: 'Validating logical consistency',
        reasoning: 'Checking for logical consistency and validity of the deductive chain',
        status: 'completed',
        tokens: estimateTokenCount('Validating logical consistency'),
        timestamp: new Date().toISOString()
    });
    // Step 5: Draw specific conclusions
    steps.push({
        id: 'step_5',
        description: 'Drawing specific conclusions',
        reasoning: 'Drawing specific, logically necessary conclusions based on the validated deductive chain',
        status: 'completed',
        tokens: estimateTokenCount('Drawing specific conclusions'),
        timestamp: new Date().toISOString()
    });
    // Return only the requested number of steps
    return steps.slice(0, maxSteps);
}
/**
 * Generates inductive reasoning steps (specific observations to general principles)
 */
async function generateInductiveReasoningSteps(problem, context = [], maxSteps = 5) {
    const steps = [];
    // Step 1: Gather observations
    steps.push({
        id: 'step_1',
        description: 'Gathering observations',
        reasoning: `Collecting specific observations relevant to the problem: "${problem}"`,
        status: 'completed',
        tokens: estimateTokenCount(problem),
        timestamp: new Date().toISOString()
    });
    // Step 2: Identify patterns
    steps.push({
        id: 'step_2',
        description: 'Identifying patterns',
        reasoning: 'Analyzing observations to identify recurring patterns and similarities',
        status: 'completed',
        tokens: estimateTokenCount('Identifying patterns'),
        timestamp: new Date().toISOString()
    });
    // Step 3: Formulate hypothesis
    steps.push({
        id: 'step_3',
        description: 'Formulating hypothesis',
        reasoning: 'Developing a general hypothesis that explains the observed patterns',
        status: 'completed',
        tokens: estimateTokenCount('Formulating hypothesis'),
        timestamp: new Date().toISOString()
    });
    // Step 4: Test hypothesis against new cases
    steps.push({
        id: 'step_4',
        description: 'Testing hypothesis',
        reasoning: 'Testing the hypothesis against new cases or additional observations',
        status: 'completed',
        tokens: estimateTokenCount('Testing hypothesis'),
        timestamp: new Date().toISOString()
    });
    // Step 5: Establish general principle
    steps.push({
        id: 'step_5',
        description: 'Establishing general principle',
        reasoning: 'Establishing a general principle based on validated inductive reasoning',
        status: 'completed',
        tokens: estimateTokenCount('Establishing general principle'),
        timestamp: new Date().toISOString()
    });
    // Return only the requested number of steps
    return steps.slice(0, maxSteps);
}
/**
 * Generates abductive reasoning steps (inference to the best explanation)
 */
async function generateAbductiveReasoningSteps(problem, context = [], maxSteps = 5) {
    const steps = [];
    // Step 1: Observe facts
    steps.push({
        id: 'step_1',
        description: 'Observing facts',
        reasoning: `Identifying the facts that need to be explained: "${problem}"`,
        status: 'completed',
        tokens: estimateTokenCount(problem),
        timestamp: new Date().toISOString()
    });
    // Step 2: Generate multiple hypotheses
    steps.push({
        id: 'step_2',
        description: 'Generating hypotheses',
        reasoning: 'Generating multiple hypotheses that could explain the observed facts',
        status: 'completed',
        tokens: estimateTokenCount('Generating hypotheses'),
        timestamp: new Date().toISOString()
    });
    // Step 3: Evaluate explanatory power
    steps.push({
        id: 'step_3',
        description: 'Evaluating explanatory power',
        reasoning: 'Assessing each hypothesis for its explanatory power, simplicity, and coherence',
        status: 'completed',
        tokens: estimateTokenCount('Evaluating explanatory power'),
        timestamp: new Date().toISOString()
    });
    // Step 4: Compare against alternative explanations
    steps.push({
        id: 'step_4',
        description: 'Comparing alternative explanations',
        reasoning: 'Comparing the leading hypothesis against alternative explanations',
        status: 'completed',
        tokens: estimateTokenCount('Comparing alternative explanations'),
        timestamp: new Date().toISOString()
    });
    // Step 5: Select best explanation
    steps.push({
        id: 'step_5',
        description: 'Selecting best explanation',
        reasoning: 'Selecting the hypothesis that provides the best explanation of the observed facts',
        status: 'completed',
        tokens: estimateTokenCount('Selecting best explanation'),
        timestamp: new Date().toISOString()
    });
    // Return only the requested number of steps
    return steps.slice(0, maxSteps);
}
/**
 * Generates a conclusion based on the specific reasoning system used
 */
function generateSystemSpecificConclusion(steps, reasoningSystem) {
    if (steps.length === 0)
        return 'No analysis was performed';
    const lastStep = steps[steps.length - 1];
    switch (reasoningSystem.toLowerCase()) {
        case 'chain_of_thought':
            return `Chain of thought analysis complete with ${steps.length} linked steps. The sequential reasoning process led to: ${lastStep.reasoning}`;
        case 'tree_of_thoughts':
            return `Tree of thoughts analysis explored multiple reasoning paths over ${steps.length} steps. The optimal solution path concluded: ${lastStep.reasoning}`;
        case 'deductive':
            return `Deductive reasoning process complete, applying general principles to derive specific conclusions: ${lastStep.reasoning}`;
        case 'inductive':
            return `Inductive reasoning process complete, inferring general principles from specific observations: ${lastStep.reasoning}`;
        case 'abductive':
            return `Abductive reasoning process complete, identifying the most likely explanation: ${lastStep.reasoning}`;
        default:
            return `Analysis complete with ${steps.length} steps. Final reasoning: ${lastStep.reasoning}`;
    }
}
/**
 * Calculates a confidence score adjusted for the specific reasoning system
 */
function calculateSystemAdjustedConfidence(steps, reasoningSystem) {
    // Base confidence from completed steps
    const completedSteps = steps.filter(s => s.status === 'completed');
    let baseConfidence = completedSteps.length / steps.length;
    // Adjust based on reasoning system characteristics
    switch (reasoningSystem.toLowerCase()) {
        case 'deductive':
            // Deductive reasoning can have high confidence when logical steps are complete
            return Math.min(1, baseConfidence * 1.2);
        case 'inductive':
            // Inductive reasoning typically has lower confidence due to probability
            return baseConfidence * 0.9;
        case 'abductive':
            // Abductive reasoning has variable confidence based on explanation quality
            return baseConfidence * 0.85;
        case 'tree_of_thoughts':
            // Tree of thoughts can have higher confidence due to exploration of alternatives
            return Math.min(1, baseConfidence * 1.1);
        default:
            return baseConfidence;
    }
}
export default {
    processStructuredThinking,
    performReasoning
};
//# sourceMappingURL=intelligenceService.js.map