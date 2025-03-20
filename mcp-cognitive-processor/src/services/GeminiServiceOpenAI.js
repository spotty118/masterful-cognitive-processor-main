import OpenAI from 'openai';
export class GeminiServiceOpenAI {
    constructor(apiKey, modelName = "google/gemini-2.0-pro-exp-02-05:free") {
        this.apiKey = apiKey.trim(); // Ensure no whitespace in API key
        this.defaultModel = modelName;
        if (!this.apiKey) {
            console.error("WARNING: OpenRouter API key is empty. Authentication will fail.");
        }
        // Initialize the OpenAI client with OpenRouter configuration
        this.openaiClient = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: this.apiKey,
            defaultHeaders: {
                'HTTP-Referer': 'https://localhost', // Required by OpenRouter
                'X-Title': 'Masterful Cognitive Processor', // Application identifier
            },
        });
    }
    async query(data) {
        try {
            // Validate input data
            if (!data || !data.inputs) {
                throw new Error("Invalid input: 'inputs' field is required");
            }
            // Check if the problem field is present in the input
            if (data.inputs.includes('Problem:') && data.inputs.split('Problem:')[1].trim() === '') {
                throw new Error("The 'problem' field is required and must be a non-empty string");
            }
            // Enhanced validation for API key
            if (!this.apiKey) {
                throw new Error("OpenRouter API Authentication Error: No API key provided. Please check your .env file and ensure OPENROUTER_API_KEY is set correctly.");
            }
            console.log('Sending request to OpenRouter using OpenAI SDK');
            // Only log API key details if it exists (for security)
            if (this.apiKey) {
                const apiKeyLength = this.apiKey.length;
                console.log(`API Key: ${this.apiKey.substring(0, 4)}...${this.apiKey.substring(apiKeyLength - 4)} (${apiKeyLength} chars)`);
            }
            else {
                console.log('API Key: NOT SET');
            }
            // Format request for OpenRouter API using OpenAI SDK format
            // Properly type the messages array as ChatCompletionMessageParam[]
            const messages = [
                {
                    role: "user",
                    content: data.inputs
                }
            ];
            const requestOptions = {
                model: this.defaultModel,
                messages: messages,
                max_tokens: data.max_tokens || 800,
                temperature: data.temperature || 0.7
            };
            console.log(`Request options: ${JSON.stringify(requestOptions, null, 2)}`);
            // Use OpenAI SDK to make the request
            const completion = await this.openaiClient.chat.completions.create(requestOptions);
            console.log('OpenRouter API Response received successfully');
            console.log('Response:', JSON.stringify(completion, null, 2));
            // Convert OpenRouter response to match HuggingFace response format
            // for compatibility with existing code
            return {
                generated_text: completion.choices[0].message.content,
                response: completion.choices[0].message.content
            };
        }
        catch (error) {
            console.error("Error querying OpenRouter API for Gemini Pro:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            // Add more specific error handling for common issues
            if (errorMessage.includes('Authentication') || errorMessage.includes('auth')) {
                console.error('AUTHENTICATION ERROR DETAILS:');
                console.error(`API Key being used: ${this.apiKey.substring(0, 4)}...${this.apiKey.substring(this.apiKey.length - 4)}`);
                console.error('Try verifying your API key on the OpenRouter dashboard: https://openrouter.ai/keys');
                console.error('Ensure your account is properly set up and has available credits.');
            }
            throw error;
        }
    }
}
