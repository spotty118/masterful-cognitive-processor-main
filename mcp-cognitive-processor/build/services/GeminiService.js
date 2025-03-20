import fetch from 'node-fetch';
import { EventEmitter } from 'events';
export class GeminiService extends EventEmitter {
    apiKey;
    modelEndpoint;
    modelName;
    modelVariant;
    fallbackEnabled;
    constructor(apiKey, modelVariant = 'pro', enableFallback = true) {
        super();
        this.apiKey = apiKey.trim();
        this.modelVariant = modelVariant;
        this.fallbackEnabled = enableFallback;
        if (!this.apiKey) {
            console.error("WARNING: OpenRouter API key is empty. Authentication will fail.");
        }
        this.modelEndpoint = `https://openrouter.ai/api/v1/chat/completions`;
        this.modelName = this.getModelNameForVariant(this.modelVariant);
    }
    // Get the appropriate model name based on the variant
    getModelNameForVariant(variant) {
        switch (variant) {
            case 'pro':
                return "google/gemini-2.0-pro-exp-02-05:free";
            case 'flash':
                return "google/gemini-2.0-flash-thinking-exp:free"; // Specific Gemini Flash model for thinking
            default:
                return "google/gemini-2.0-pro-exp-02-05:free";
        }
    }
    getHeaders() {
        const authHeader = this.apiKey.startsWith('Bearer ') ? this.apiKey : `Bearer ${this.apiKey}`;
        return {
            "Authorization": authHeader,
            "HTTP-Referer": "https://localhost",
            "X-Title": "Masterful Cognitive Processor",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "OpenAI-Organization": "unused",
            "User-Agent": "MasterfulCognitiveProcessor/1.0"
        };
    }
    async handleErrorResponse(response) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('text/html')) {
            const htmlContent = await response.text();
            console.error('Received HTML instead of JSON:', htmlContent.substring(0, 200) + '...');
            throw new Error(`OpenRouter API returned HTML instead of JSON. Status: ${response.status}`);
        }
        if (response.status === 401 || response.status === 403) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API Authentication Error: ${response.status} - ${errorText || "Invalid credentials"}`);
        }
        try {
            const errorData = await response.json();
            const errorMessage = typeof errorData.error === 'object' && errorData.error?.message
                ? errorData.error.message
                : typeof errorData.error === 'string'
                    ? errorData.error
                    : "Unknown error";
            throw new Error(`OpenRouter API error: ${response.status} - ${errorMessage}`);
        }
        catch (error) {
            throw new Error(`Failed to parse error response: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async query(data, options = {}) {
        try {
            if (!data || !data.inputs) {
                throw new Error("Invalid input: 'inputs' field is required");
            }
            if (data.inputs.includes('Problem:') && data.inputs.split('Problem:')[1].trim() === '') {
                throw new Error("The 'problem' field is required and must be a non-empty string");
            }
            const messages = [{
                    role: "user",
                    content: data.inputs
                }];
            const requestBody = {
                model: this.modelName,
                messages,
                max_tokens: options.maxTokens || data.max_tokens || 800,
                temperature: options.temperature || data.temperature || 0.7,
                stream: options.enableStreaming || false
            };
            if (options.enableStreaming) {
                return this.handleStreamingResponse(requestBody, options.onToken);
            }
            const response = await fetch(this.modelEndpoint, {
                headers: this.getHeaders(),
                method: "POST",
                body: JSON.stringify(requestBody),
            });
            if (!response.ok) {
                // Try fallback to Gemini Flash if enabled and current model is Pro
                if (this.fallbackEnabled && this.modelVariant === 'pro') {
                    console.log('Gemini Pro request failed. Falling back to Gemini Flash...');
                    // Switch to Flash model for this request
                    const flashModelName = this.getModelNameForVariant('flash');
                    const flashRequestBody = { ...requestBody, model: flashModelName };
                    try {
                        const flashResponse = await fetch(this.modelEndpoint, {
                            headers: this.getHeaders(),
                            method: "POST",
                            body: JSON.stringify(flashRequestBody),
                        });
                        if (flashResponse.ok) {
                            console.log('Successfully used Gemini Flash as fallback');
                            const flashResult = await flashResponse.json();
                            const flashContent = flashResult.choices[0].message.content;
                            return {
                                generated_text: flashContent,
                                response: flashContent,
                                model: 'gemini-flash',
                                fallback_used: true
                            };
                        }
                        else {
                            console.error('Fallback to Gemini Flash also failed');
                        }
                    }
                    catch (fallbackError) {
                        console.error('Error during fallback to Gemini Flash:', fallbackError);
                    }
                }
                // If we get here, either fallback is disabled, not applicable, or also failed
                await this.handleErrorResponse(response);
            }
            const result = await response.json();
            const messageContent = result.choices[0].message.content;
            return {
                generated_text: messageContent,
                response: messageContent,
                model: this.modelName
            };
        }
        catch (error) {
            console.error("Error querying OpenRouter API for Gemini 2.0 Pro:", error);
            throw error;
        }
    }
    async handleStreamingResponse(requestBody, onToken) {
        const response = await fetch(this.modelEndpoint, {
            headers: this.getHeaders(),
            method: "POST",
            body: JSON.stringify({ ...requestBody, stream: true }),
        });
        if (!response.ok) {
            await this.handleErrorResponse(response);
        }
        if (!response.body) {
            throw new Error('No response body received');
        }
        const reader = response.body;
        const decoder = new TextDecoder();
        const chunks = [];
        try {
            const streamReader = reader.getReader();
            while (true) {
                const { done, value } = await streamReader.read();
                if (done)
                    break;
                const chunk = decoder.decode(value, { stream: true });
                chunks.push(chunk);
                // Emit progress event
                this.emit('progress', { chunk });
                if (onToken) {
                    onToken(chunk);
                }
            }
        }
        catch (error) {
            console.error('Error processing stream:', error);
            throw error;
        }
        const fullResponse = chunks.join('');
        const messages = fullResponse
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
            try {
                return JSON.parse(line);
            }
            catch {
                return null;
            }
        })
            .filter((msg) => msg !== null);
        // Combine all message contents
        const combinedContent = messages.reduce((acc, msg) => {
            if (msg?.choices?.[0]?.delta?.content) {
                return acc + msg.choices[0].delta.content;
            }
            return acc;
        }, '');
        return {
            generated_text: combinedContent,
            response: combinedContent
        };
    }
    async *createResponseStream(data, options = {}) {
        if (!data || !data.inputs) {
            throw new Error("Invalid input: 'inputs' field is required");
        }
        const requestBody = {
            model: "google/gemini-2.0-pro-exp-02-05:free",
            messages: [{
                    role: "user",
                    content: data.inputs
                }],
            max_tokens: options.maxTokens || 800,
            temperature: options.temperature || 0.7,
            stream: true
        };
        const response = await fetch(this.modelEndpoint, {
            headers: this.getHeaders(),
            method: "POST",
            body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
            await this.handleErrorResponse(response);
        }
        if (!response.body) {
            throw new Error('No response body received');
        }
        const reader = response.body;
        const decoder = new TextDecoder();
        try {
            const streamReader = reader.getReader();
            while (true) {
                const { done, value } = await streamReader.read();
                if (done)
                    break;
                const chunk = decoder.decode(value, { stream: true });
                const messages = chunk
                    .split('\n')
                    .filter(line => line.trim())
                    .map(line => {
                    try {
                        return JSON.parse(line);
                    }
                    catch {
                        return null;
                    }
                })
                    .filter((msg) => msg !== null);
                for (const msg of messages) {
                    if (msg?.choices?.[0]?.delta?.content) {
                        yield msg.choices[0].delta.content;
                    }
                }
            }
        }
        finally {
            reader.getReader().releaseLock();
        }
    }
}
//# sourceMappingURL=GeminiService.js.map