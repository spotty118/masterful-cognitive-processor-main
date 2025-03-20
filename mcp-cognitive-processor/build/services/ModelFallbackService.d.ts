import { IAIService } from '../interfaces/IAIService.js';
import { EventEmitter } from 'events';
interface FallbackConfig {
    timeout: number;
    maxRetries: number;
    healthCheckInterval: number;
    providers: {
        name: string;
        priority: number;
        service: IAIService;
        weight: number;
        maxTimeout: number;
    }[];
}
export declare class ModelFallbackService extends EventEmitter {
    private static instance;
    private healthMonitor;
    private config;
    private providerStats;
    private checkInterval;
    private constructor();
    static getInstance(config?: Partial<FallbackConfig>): ModelFallbackService;
    registerProvider(name: string, service: IAIService, priority?: number, weight?: number, maxTimeout?: number): void;
    private sortProviders;
    query(data: any): Promise<any>;
    private checkProviderHealth;
    private startHealthChecks;
    getProviderStats(): Map<string, {
        failures: number;
        successes: number;
        avgResponseTime: number;
        lastSuccess: number;
    }>;
    getActiveProviders(): string[];
    removeProvider(name: string): void;
    clearStats(): void;
}
export {};
