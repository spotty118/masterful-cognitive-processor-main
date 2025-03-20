import { IAIService } from '../interfaces/IAIService.js';

export class GeminiServiceAdapter implements IAIService {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async query(params: { inputs: string; max_tokens?: number }): Promise<any> {
        try {
            const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: params.inputs
                        }]
                    }],
                    generationConfig: {
                        maxOutputTokens: params.max_tokens || 1024,
                        temperature: 0.7,
                        topP: 0.8,
                        topK: 40
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.statusText}`);
            }

            const data = await response.json();
            return this.formatGeminiResponse(data);
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            throw error;
        }
    }

    private formatGeminiResponse(data: any): any {
        try {
            // Extract the generated text from Gemini's response structure
            const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!generatedText) {
                throw new Error('No generated text in Gemini response');
            }

            // Try to parse as JSON if it looks like JSON
            if (generatedText.trim().startsWith('{') || generatedText.trim().startsWith('[')) {
                try {
                    return JSON.parse(generatedText);
                } catch (e) {
                    // If parsing fails, return as-is
                    return generatedText;
                }
            }

            return generatedText;
        } catch (error) {
            console.error('Error formatting Gemini response:', error);
            throw error;
        }
    }
}