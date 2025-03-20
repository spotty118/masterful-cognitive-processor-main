export class GeminiPreprocessingService {
    aiService;
    constructor(aiService) {
        this.aiService = aiService;
    }
    async preprocessQuery(query) {
        try {
            const systemPrompt = `Analyze the following query and structure it for deeper processing:
1. Extract the main objective and break it into subtasks
2. Identify relevant context needed
3. Assess complexity and suggest approach
4. For code-related queries, identify relevant code snippets and file system context
Maintain high precision while being concise.`;
            const response = await this.aiService.query({
                inputs: `${systemPrompt}\n\nQuery: ${query}`,
                max_tokens: 1000
            });
            return this.parseGeminiResponse(response);
        }
        catch (error) {
            console.error('Error in Gemini preprocessing:', error);
            throw error;
        }
    }
    parseGeminiResponse(response) {
        try {
            const parsedResponse = typeof response === 'string' ?
                JSON.parse(response) : response;
            return {
                structuredQuery: {
                    mainObjective: parsedResponse.mainObjective || '',
                    subTasks: parsedResponse.subTasks || [],
                    relevantContext: parsedResponse.relevantContext || []
                },
                initialAnalysis: {
                    complexityScore: parsedResponse.complexityScore || 0,
                    suggestedApproach: parsedResponse.suggestedApproach || '',
                    potentialChallenges: parsedResponse.potentialChallenges || []
                },
                codeAnalysis: parsedResponse.codeAnalysis
            };
        }
        catch (error) {
            console.error('Error parsing Gemini response:', error);
            throw new Error('Failed to parse Gemini preprocessing response');
        }
    }
}
//# sourceMappingURL=GeminiPreprocessingService.js.map