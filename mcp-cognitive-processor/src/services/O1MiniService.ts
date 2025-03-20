import { IAIService } from '../interfaces/IAIService.js';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';

export class O1MiniService implements IAIService {
  private apiKey: string;
  private openaiClient: OpenAI;
  private readonly MODEL = 'openai/o1-mini';

  constructor(apiKey: string) {
    this.apiKey = apiKey.trim();
    
    if (!this.apiKey) {
      console.error("WARNING: OpenRouter API key is empty. Authentication will fail.");
    }
    
    this.openaiClient = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: this.apiKey,
      defaultHeaders: {
        'HTTP-Referer': 'https://localhost',
        'X-Title': 'Masterful Cognitive Processor',
      },
    });
  }
  
  async query(data: any): Promise<any> {
    try {
      if (!data || !data.inputs) {
        throw new Error("Invalid input: 'inputs' field is required");
      }
      
      if (!this.apiKey) {
        throw new Error("OpenRouter API Authentication Error: No API key provided");
      }
      
      console.log('Using o1-mini fallback model via OpenRouter');
      
      const messages: ChatCompletionMessageParam[] = [
        {
          role: "user",
          content: data.inputs
        }
      ];
      
      const completion = await this.openaiClient.chat.completions.create({
        model: this.MODEL,
        messages: messages,
        max_tokens: data.max_tokens || 800,
        temperature: data.temperature || 0.7
      });
      
      return {
        generated_text: completion.choices[0].message.content,
        response: completion.choices[0].message.content
      };
    } catch (error) {
      console.error("Error using o1-mini fallback model:", error);
      throw error;
    }
  }
}