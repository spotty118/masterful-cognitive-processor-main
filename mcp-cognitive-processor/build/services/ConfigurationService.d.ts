import { MCPConfig } from '../models/types.js';
export declare class ConfigurationService {
    private config;
    private configPath;
    private inMemoryOnly;
    constructor(configPath?: string);
    private loadConfig;
    getConfig(): MCPConfig;
    updateConfig(newConfig: Partial<MCPConfig>): void;
    private saveConfig;
    private getDefaultConfig;
    isInMemoryOnly(): boolean;
    exportConfig(altPath: string): boolean;
}
