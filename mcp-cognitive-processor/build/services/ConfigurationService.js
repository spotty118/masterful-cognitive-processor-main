import * as fs from 'fs';
import * as path from 'path';
export class ConfigurationService {
    config;
    configPath;
    inMemoryOnly = false;
    constructor(configPath = process.env.MCP_CONFIG_PATH || 'mcp-settings.json') {
        this.configPath = configPath;
        this.config = this.loadConfig();
    }
    loadConfig() {
        try {
            const configContent = fs.readFileSync(this.configPath, 'utf8');
            return JSON.parse(configContent);
        }
        catch (error) {
            console.warn(`Could not load config from ${this.configPath}, using default config`);
            this.inMemoryOnly = true;
            return this.getDefaultConfig();
        }
    }
    getConfig() {
        return { ...this.config };
    }
    updateConfig(newConfig) {
        this.config = {
            ...this.config,
            ...newConfig
        };
        this.saveConfig();
    }
    saveConfig() {
        if (this.inMemoryOnly) {
            console.info("Operating with in-memory configuration only (previous write failed)");
            return;
        }
        try {
            const dirPath = path.dirname(this.configPath);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
            const testPath = path.join(dirPath, '.write-test');
            try {
                fs.writeFileSync(testPath, 'test', { flag: 'w' });
                fs.unlinkSync(testPath);
            }
            catch (testError) {
                this.inMemoryOnly = true;
                throw new Error(`File system is read-only, switching to in-memory configuration: ${testError}`);
            }
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), { flag: 'w' });
        }
        catch (error) {
            this.inMemoryOnly = true;
            throw error;
        }
    }
    getDefaultConfig() {
        return {
            name: "Masterful Cognitive Processor",
            version: "1.0.0",
            description: "An advanced cognitive processing system",
            defaultModel: {
                name: "gemini-flash"
            },
            maxStepsPerStrategy: 10,
            tokenBudget: 10000,
            optimizationThreshold: 0.8,
            memoryPath: './data/memory',
            cachePath: './data/cache',
            core: {
                thinkingModels: [],
                intelligence: {
                    reasoningSystems: [],
                    abstractionLevels: []
                }
            },
            stepByStepThinking: {
                enabled: true,
                documentationLevel: 'detailed',
                components: []
            },
            memory: {
                systemType: 'hierarchical',
                components: []
            },
            preprocessingPipeline: {
                enabled: true,
                gemini: {
                    model: 'gemini-pro',
                    temperature: 0.7,
                    maxTokens: 1000,
                    topP: 0.8
                },
                claude: {
                    model: 'claude-2.1',
                    temperature: 0.5,
                    maxTokens: 2048
                },
                pipelineSteps: []
            }
        };
    }
    isInMemoryOnly() {
        return this.inMemoryOnly;
    }
    exportConfig(altPath) {
        try {
            const dirPath = path.dirname(altPath);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
            fs.writeFileSync(altPath, JSON.stringify(this.config, null, 2), { flag: 'w' });
            return true;
        }
        catch (error) {
            console.error(`Failed to export configuration to ${altPath}: ${error}`);
            return false;
        }
    }
}
//# sourceMappingURL=ConfigurationService.js.map