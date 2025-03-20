/**
 * Intelligence Service
 * Core processing capabilities for structured thinking and reasoning
 */
import { LLMRequest, LLMResponse, ReasoningRequest, ReasoningResponse } from '../models/types.js';
/**
 * Process a request using structured thinking
 */
export declare function processStructuredThinking(request: LLMRequest): Promise<LLMResponse>;
/**
 * Performs reasoning using structured thinking
 */
export declare function performReasoning(request: ReasoningRequest): Promise<ReasoningResponse>;
declare const _default: {
    processStructuredThinking: typeof processStructuredThinking;
    performReasoning: typeof performReasoning;
};
export default _default;
