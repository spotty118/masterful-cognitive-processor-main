import { IAIService } from '../interfaces/IAIService.js';
import { PreprocessingResult } from './GeminiPreprocessingService.js';

export interface ReasoningResult {
    detailedAnalysis: {
        conclusions: string[];
        recommendations: string[];
        technicalDetails?: {
            implementation: string;
            considerations: string[];
            alternatives: string[];
        };
    };
    reasoning: {
        path: string[];
        justification: string;
    };
    confidence: number;
}

export class ClaudeReasoningService {
    constructor(private aiService: IAIService) {}

    async performDeepReasoning(preprocessedData: PreprocessingResult): Promise<ReasoningResult> {
        try {
            const systemPrompt = `Based on Gemini's preprocessing analysis, perform deep reasoning:
1. Analyze each subtask and context thoroughly
2. Apply domain expertise to generate detailed solutions
3. Consider edge cases and potential issues
4. Provide clear, actionable recommendations
5. For code-related tasks, include technical implementation details
Focus on depth and accuracy in your analysis.`;

            const prompt = this.constructDetailedPrompt(preprocessedData);
            
            const response = await this.aiService.query({
                inputs: `${systemPrompt}\n\n${prompt}`,
                max_tokens: 2000
            });

            return this.parseClaudeResponse(response);
        } catch (error) {
            console.error('Error in Claude reasoning:', error);
            throw error;
        }
    }

    private constructDetailedPrompt(data: PreprocessingResult): string {
        return `
Main Objective: ${data.structuredQuery.mainObjective}

Subtasks:
${data.structuredQuery.subTasks.map((task: string) => `- ${task}`).join('\n')}

Relevant Context:
${data.structuredQuery.relevantContext.map((ctx: string) => `- ${ctx}`).join('\n')}

Initial Analysis:
- Complexity Score: ${data.initialAnalysis.complexityScore}
- Suggested Approach: ${data.initialAnalysis.suggestedApproach}
- Potential Challenges: ${data.initialAnalysis.potentialChallenges.join(', ')}

${data.codeAnalysis ? `Code Analysis:
${data.codeAnalysis.snippets.map((snippet: { location: string; purpose: string; code: string }) => 
    `Location: ${snippet.location}\nPurpose: ${snippet.purpose}\nCode:\n${snippet.code}`
).join('\n\n')}` : ''}`;
    }

    private parseClaudeResponse(response: any): ReasoningResult {
        try {
            const parsedResponse = typeof response === 'string' ? 
                JSON.parse(response) : response;

            return {
                detailedAnalysis: {
                    conclusions: parsedResponse.conclusions || [],
                    recommendations: parsedResponse.recommendations || [],
                    technicalDetails: parsedResponse.technicalDetails
                },
                reasoning: {
                    path: parsedResponse.reasoningPath || [],
                    justification: parsedResponse.justification || ''
                },
                confidence: parsedResponse.confidence || 0
            };
        } catch (error) {
            console.error('Error parsing Claude response:', error);
            throw new Error('Failed to parse Claude reasoning response');
        }
    }
}