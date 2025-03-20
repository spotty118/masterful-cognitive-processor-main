import OpenAI from 'openai';
export class GoogleFlashServiceAdapter {
    apiKey;
    model = 'google/gemini-2.0-flash-exp-02-05:free'; // OpenRouter model ID for Google Flash
    openaiClient;
    instanceId;
    constructor(apiKey) {
        this.apiKey = apiKey.trim();
        this.instanceId = `flash_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        if (!this.apiKey) {
            console.error("WARNING: OpenRouter API key is empty. Authentication will fail.");
        }
        // Create OpenAI client for OpenRouter
        this.openaiClient = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: this.apiKey,
            defaultHeaders: {
                'HTTP-Referer': 'https://localhost',
                'X-Title': 'Masterful Cognitive Processor',
                'X-Instance-ID': this.instanceId
            }
        });
        console.log(`Created new GoogleFlashServiceAdapter instance with ID: ${this.instanceId} using OpenRouter`);
    }
    async query(params) {
        try {
            console.log(`STEP 1: Google Flash - Starting API call via OpenRouter [UNIQUE INSTANCE: ${this.instanceId}]`);
            // Create a unique identifier for this request to track it through the system
            const requestId = `flash_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            console.log(`STEP 1: Google Flash - Request ID: ${requestId}`);
            // Convert to OpenAI message format
            const messages = params.messages?.map(msg => ({
                role: msg.role,
                content: msg.content
            })) || [];
            if (params.systemPrompt) {
                messages.unshift({ role: 'system', content: params.systemPrompt });
            }
            else if (params.prompt && !params.messages) {
                messages.push({ role: 'user', content: params.prompt });
            }
            console.log(`STEP 1: Google Flash - Sending request to OpenRouter API (ID: ${requestId})`);
            // Call OpenRouter using OpenAI client
            const completion = await this.openaiClient.chat.completions.create({
                model: this.model, // Using OpenRouter's Gemini Flash model
                messages: messages,
                temperature: params.temperature || 0.5,
                max_tokens: params.maxTokens || 1500
            });
            console.log(`STEP 1: Google Flash - Response received successfully from OpenRouter (ID: ${requestId})`);
            const result = {
                response: completion.choices[0].message.content || '',
                model: this.model,
                tokenUsage: {
                    prompt: completion.usage?.prompt_tokens || 0,
                    completion: completion.usage?.completion_tokens || 0,
                    total: completion.usage?.total_tokens || 0
                },
                latency: 0 // OpenRouter doesn't provide latency info
            };
            console.log(`STEP 1: Google Flash - Processing complete, moving to next step (ID: ${requestId})`);
            // Add a small delay before returning to ensure separation between API calls
            await new Promise(resolve => setTimeout(resolve, 500));
            return result;
        }
        catch (error) {
            console.error(`STEP 1: Error calling OpenRouter API for Google Flash (Instance ${this.instanceId}):`, error);
            throw error;
        }
    }
}
//# sourceMappingURL=GoogleFlashServiceAdapter.js.map