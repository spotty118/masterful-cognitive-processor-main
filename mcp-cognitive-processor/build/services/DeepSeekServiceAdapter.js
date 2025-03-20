import OpenAI from 'openai';
export class DeepSeekServiceAdapter {
    // A map to store instances with unique IDs
    static instances = new Map();
    openaiClient;
    apiKey;
    model;
    instanceId;
    constructor(apiKey, model = 'deepseek-ai/deepseek-chat-8b') {
        this.apiKey = apiKey.trim();
        this.model = model;
        this.instanceId = `deepseek_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        if (!this.apiKey) {
            console.error("WARNING: OpenRouter API key is empty. Authentication will fail.");
        }
        // Create a unique OpenAI client for this instance
        this.openaiClient = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: apiKey,
            defaultHeaders: {
                'HTTP-Referer': 'https://localhost',
                'X-Title': 'Masterful Cognitive Processor',
                'X-Instance-ID': this.instanceId // Add instance ID to track requests
            }
        });
        console.log(`Created new DeepSeekServiceAdapter instance with ID: ${this.instanceId}`);
    }
    static getInstance(apiKey, model) {
        // Always create a new instance to ensure step isolation
        const instance = new DeepSeekServiceAdapter(apiKey, model);
        this.instances.set(instance.instanceId, instance);
        return instance;
    }
    async query(params) {
        try {
            console.log(`STEP 3: DeepSeek - Starting API call with instance ${this.instanceId}`);
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
            console.log(`STEP 3: DeepSeek - Sending request to API with model: ${this.model}`);
            const completion = await this.openaiClient.chat.completions.create({
                model: this.model,
                messages,
                temperature: params.temperature || 0.7,
                max_tokens: params.maxTokens || 1000,
            });
            console.log(`STEP 3: DeepSeek - Response received successfully`);
            // Log the instance ID for tracking but don't include it in the response
            console.log(`STEP 3: DeepSeek - Instance ${this.instanceId} completed processing`);
            return {
                response: completion.choices[0].message.content || '',
                model: this.model,
                tokenUsage: {
                    prompt: completion.usage?.prompt_tokens || 0,
                    completion: completion.usage?.completion_tokens || 0,
                    total: completion.usage?.total_tokens || 0
                }
            };
        }
        catch (error) {
            console.error(`STEP 3: Error calling OpenRouter API for DeepSeek (instance ${this.instanceId}):`, error);
            throw error;
        }
    }
}
//# sourceMappingURL=DeepSeekServiceAdapter.js.map