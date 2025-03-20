import { IAIService } from '../interfaces/IAIService.js';
import { LLMRequest, LLMResponse } from '../models/types.js';

export class ClaudeServiceAdapter implements IAIService {
    private apiKey: string;
    private model: string;
    private static instance: ClaudeServiceAdapter;

    private constructor(apiKey: string, model: string = 'claude-3-opus-20240229') {
        this.apiKey = apiKey;
        this.model = model;
    }
    
    public static getInstance(apiKey: string, model?: string): ClaudeServiceAdapter {
        if (!ClaudeServiceAdapter.instance) {
            ClaudeServiceAdapter.instance = new ClaudeServiceAdapter(apiKey, model);
        }
        return ClaudeServiceAdapter.instance;
    }

    async query(params: LLMRequest): Promise<LLMResponse> {
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: params.model || this.model,
                    messages: params.messages || [{
                        role: 'user',
                        content: params.prompt || ''
                    }],
                    max_tokens: params.maxTokens || 2048,
                    temperature: params.temperature || 0.5
                })
            });

            if (!response.ok) {
                throw new Error(`Claude API error: ${response.statusText}`);
            }

            const data = await response.json();
            return this.formatClaudeResponse(data);
        } catch (error) {
            console.error('Error calling Claude API:', error);
            throw error;
        }
    }

    private formatClaudeResponse(data: any): LLMResponse {
        try {
            // Extract the generated text from Claude's response structure
            const generatedText = data.content?.[0]?.text;
            
            if (!generatedText) {
                throw new Error('No generated text in Claude response');
            }
            
            return {
                response: generatedText,
                model: data.model || 'claude-3-opus-20240229',
                tokenUsage: {
                    prompt: data.usage?.input_tokens || 0,
                    completion: data.usage?.output_tokens || 0,
                    total: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
                },
                latency: data.usage?.latency || 0
            };
        } catch (error) {
            console.error('Error formatting Claude response:', error);
            throw error;
        }
    }
}