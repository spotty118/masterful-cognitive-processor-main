#!/usr/bin/env node
import { mcpConfig } from './config/mcp-config.js';
import { ThinkingServiceImpl } from './services/ThinkingServiceImpl.js';
import tokenHistoryService from './services/tokenHistoryService.js';
declare const thinkingService: ThinkingServiceImpl;
export { thinkingService, tokenHistoryService, mcpConfig };
declare const _default: {
    thinkingService: ThinkingServiceImpl;
    tokenHistoryService: {
        recordTokenUsage: (prompt: string, model: string, tokenUsage: {
            prompt: number;
            completion: number;
            total: number;
        }) => Promise<void>;
        predictTokenUsage: (prompt: string, model?: string) => Promise<import("./models/types.js").TokenPredictionResult>;
        getTokenStats: () => Promise<{
            totalQueries: number;
            totalTokensUsed: number;
            averageTokensPerQuery: number;
            modelStats: Record<string, {
                queries: number;
                totalTokens: number;
                averageTokens: number;
            }>;
            frequentPatterns: Array<{
                pattern: string;
                occurrences: number;
                averageTokens: number;
            }>;
        }>;
        performTokenHistoryMaintenance: () => Promise<number>;
    };
    mcpConfig: import("./models/types.js").MCPConfig;
};
export default _default;
