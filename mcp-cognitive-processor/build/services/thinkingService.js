import { ServiceFactory } from '../factories/ServiceFactory.js';
import { ThinkingServiceImpl } from './ThinkingServiceImpl.js';
import { GeminiService } from './GeminiService.js';
class ThinkingService {
    thinkingServiceImpl;
    constructor() {
        const serviceFactory = ServiceFactory;
        const tokenOptimizer = ServiceFactory.getTokenOptimizer();
        const mcpConfig = ServiceFactory.getDefaultConfig();
        // Initialize Gemini service with OpenRouter API key
        const openRouterApiKey = process.env.OPENROUTER_API_KEY || '';
        if (!openRouterApiKey) {
            console.warn('WARNING: OPENROUTER_API_KEY is not set. API calls will fail until this is configured.');
        }
        const geminiService = new GeminiService(openRouterApiKey);
        // Create thinking service with Gemini
        this.thinkingServiceImpl = new ThinkingServiceImpl(serviceFactory, tokenOptimizer, mcpConfig, geminiService);
    }
    getThinkingModels() {
        return this.thinkingServiceImpl.getThinkingModels();
    }
    async initiateThinkingProcess(config) {
        return this.thinkingServiceImpl.initiateThinkingProcess(config);
    }
    async getThinkingProgress(processId) {
        return this.thinkingServiceImpl.getThinkingProgress(processId);
    }
    async visualizeThinkingProcess(processId) {
        return this.thinkingServiceImpl.visualizeThinkingProcess(processId);
    }
    async getThinkingHistory(limit) {
        return this.thinkingServiceImpl.getThinkingHistory(limit);
    }
    async evaluateThinkingProcess(processId) {
        return this.thinkingServiceImpl.evaluateThinkingProcess(processId);
    }
    async performThinkingMaintenance() {
        return this.thinkingServiceImpl.performThinkingMaintenance();
    }
    async updateProcessConfig(config) {
        return this.thinkingServiceImpl.updateProcessConfig(config);
    }
    getProcessConfig() {
        return this.thinkingServiceImpl.getProcessConfig();
    }
}
const thinkingService = new ThinkingService();
export default thinkingService;
//# sourceMappingURL=thinkingService.js.map