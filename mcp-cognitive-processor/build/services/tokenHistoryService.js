/**
 * Token History Service
 * Tracks and analyzes token usage patterns over time
 */
import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
// Define the database file path
const DB_DIR = process.env.MCP_DB_DIR || path.join(process.cwd(), 'data');
const TOKEN_HISTORY_DIR = path.join(DB_DIR, 'token_history');
// Ensure token history directory exists
if (!fs.existsSync(TOKEN_HISTORY_DIR)) {
    fs.mkdirSync(TOKEN_HISTORY_DIR, { recursive: true });
}
// In-memory cache of token history
let tokenHistory = new Map();
let isInitialized = false;
/**
 * Initializes the token history system
 */
const initializeTokenHistory = async () => {
    if (isInitialized)
        return;
    try {
        const files = await fs.promises.readdir(TOKEN_HISTORY_DIR);
        for (const file of files) {
            if (!file.endsWith('.json'))
                continue;
            const filePath = path.join(TOKEN_HISTORY_DIR, file);
            const data = await fs.promises.readFile(filePath, 'utf8');
            const historyItem = JSON.parse(data);
            tokenHistory.set(historyItem.id, historyItem);
        }
        isInitialized = true;
    }
    catch (error) {
        console.error('Error initializing token history:', error);
        tokenHistory = new Map();
        isInitialized = true;
    }
};
/**
 * Records a new token usage event
 */
export const recordTokenUsage = async (prompt, model, tokenUsage) => {
    await initializeTokenHistory();
    const queryHash = createHash('md5').update(prompt).digest('hex');
    const id = `${model}:${queryHash}`;
    let historyItem = tokenHistory.get(id);
    if (historyItem) {
        // Update existing history item
        historyItem.frequency++;
        historyItem.lastAccessed = new Date().toISOString();
        historyItem.tokenUsage = tokenUsage;
    }
    else {
        // Create new history item
        historyItem = {
            id,
            queryHash,
            prompt,
            model,
            tokenUsage,
            timestamp: new Date().toISOString(),
            frequency: 1,
            lastAccessed: new Date().toISOString()
        };
    }
    tokenHistory.set(id, historyItem);
    // Save to disk
    const filePath = path.join(TOKEN_HISTORY_DIR, `${id}.json`);
    await fs.promises.writeFile(filePath, JSON.stringify(historyItem, null, 2));
};
/**
 * Predicts token usage for a given prompt
 */
export const predictTokenUsage = async (prompt, model) => {
    await initializeTokenHistory();
    const queryHash = createHash('md5').update(prompt).digest('hex');
    const similarQueries = [];
    // Find similar queries in history
    for (const [id, history] of tokenHistory.entries()) {
        if (model && !id.startsWith(model))
            continue;
        const similarity = calculateSimilarity(prompt, history.prompt);
        if (similarity > 0.3) { // Minimum similarity threshold
            similarQueries.push({
                queryHash: history.queryHash,
                similarity
            });
        }
    }
    // Sort by similarity
    similarQueries.sort((a, b) => b.similarity - a.similarity);
    // Calculate estimated tokens based on similar queries
    let estimatedTokens = 0;
    if (similarQueries.length > 0) {
        const topMatches = similarQueries.slice(0, 3);
        const weightedSum = topMatches.reduce((sum, match) => {
            const history = Array.from(tokenHistory.values())
                .find(h => h.queryHash === match.queryHash);
            if (!history)
                return sum;
            return sum + (history.tokenUsage.total * match.similarity);
        }, 0);
        const totalWeight = topMatches.reduce((sum, match) => sum + match.similarity, 0);
        estimatedTokens = Math.round(weightedSum / totalWeight);
    }
    else {
        // Fallback to simple estimation
        estimatedTokens = Math.round(prompt.split(/\s+/).length * 1.3);
    }
    return {
        queryHash,
        probability: similarQueries.length > 0 ? similarQueries[0].similarity : 0,
        suggestedModel: model || 'gemini-flash',
        estimatedTokens,
        similarQueries: similarQueries.slice(0, 5),
        model: model || 'default',
        confidence: similarQueries.length > 0 ? similarQueries[0].similarity : 0.5,
        factors: {
            textLength: prompt.length,
            complexity: prompt.split(/\s+/).length / 10,
            specialTokens: (prompt.match(/[^a-zA-Z0-9\s]/g) || []).length
        }
    };
};
/**
 * Gets token usage statistics
 */
export const getTokenStats = async () => {
    await initializeTokenHistory();
    const modelStats = {};
    let totalTokens = 0;
    const patterns = new Map();
    // Process each history item
    for (const history of tokenHistory.values()) {
        // Update model stats
        if (!modelStats[history.model]) {
            modelStats[history.model] = {
                queries: 0,
                totalTokens: 0,
                averageTokens: 0
            };
        }
        const stats = modelStats[history.model];
        stats.queries++;
        stats.totalTokens += history.tokenUsage.total;
        stats.averageTokens = stats.totalTokens / stats.queries;
        totalTokens += history.tokenUsage.total;
        // Extract and track patterns
        const extractedPatterns = extractPatterns(history.prompt);
        for (const pattern of extractedPatterns) {
            const patternStats = patterns.get(pattern) || { occurrences: 0, totalTokens: 0 };
            patternStats.occurrences++;
            patternStats.totalTokens += history.tokenUsage.total;
            patterns.set(pattern, patternStats);
        }
    }
    // Convert patterns to sorted array
    const frequentPatterns = Array.from(patterns.entries())
        .map(([pattern, stats]) => ({
        pattern,
        occurrences: stats.occurrences,
        averageTokens: stats.totalTokens / stats.occurrences
    }))
        .sort((a, b) => b.occurrences - a.occurrences)
        .slice(0, 10);
    return {
        totalQueries: tokenHistory.size,
        totalTokensUsed: totalTokens,
        averageTokensPerQuery: totalTokens / tokenHistory.size,
        modelStats,
        frequentPatterns
    };
};
/**
 * Performs maintenance on token history
 */
export const performTokenHistoryMaintenance = async () => {
    await initializeTokenHistory();
    let cleanedItems = 0;
    try {
        const now = Date.now();
        const THREE_MONTHS = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds
        // Clean up old history items
        for (const [id, history] of tokenHistory.entries()) {
            const lastAccessed = new Date(history.lastAccessed).getTime();
            if (now - lastAccessed > THREE_MONTHS) {
                tokenHistory.delete(id);
                const filePath = path.join(TOKEN_HISTORY_DIR, `${id}.json`);
                await fs.promises.unlink(filePath);
                cleanedItems++;
            }
        }
        return cleanedItems;
    }
    catch (error) {
        console.error('Error performing token history maintenance:', error);
        return 0;
    }
};
/**
 * Calculates similarity between two texts
 */
const calculateSimilarity = (text1, text2) => {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
};
/**
 * Extracts common patterns from text
 */
const extractPatterns = (text) => {
    const patterns = [];
    // Look for code-related patterns
    if (text.match(/function|class|method/i)) {
        patterns.push('code_definition');
    }
    if (text.match(/algorithm|complexity|performance/i)) {
        patterns.push('algorithm_analysis');
    }
    if (text.match(/api|interface|endpoint/i)) {
        patterns.push('api_design');
    }
    if (text.match(/database|query|schema/i)) {
        patterns.push('database_operation');
    }
    if (text.match(/error|exception|handling/i)) {
        patterns.push('error_handling');
    }
    return patterns;
};
export default {
    recordTokenUsage,
    predictTokenUsage,
    getTokenStats,
    performTokenHistoryMaintenance
};
//# sourceMappingURL=tokenHistoryService.js.map