import { EventEmitter } from 'events';
export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    details: {
        [key: string]: {
            status: 'up' | 'down' | 'degraded';
            lastCheck: string;
            responseTime?: number;
            error?: string;
        };
    };
}
export interface MetricsData {
    requestCount: number;
    averageResponseTime: number;
    errorRate: number;
    tokenUsage: number;
    cacheHitRate: number;
    serviceMetrics: {
        [key: string]: {
            requests: number;
            errors: number;
            totalResponseTime: number;
        };
    };
}
export declare class HealthMonitoringService extends EventEmitter {
    private static instance;
    private health;
    private metrics;
    private checkInterval;
    private constructor();
    static getInstance(): HealthMonitoringService;
    private initializeHealth;
    private initializeMetrics;
    checkServiceHealth(serviceName: string): Promise<void>;
    private updateOverallHealth;
    recordMetrics(serviceName: string, { responseTime, isError, tokenCount, isCacheHit }: {
        responseTime: number;
        isError?: boolean;
        tokenCount?: number;
        isCacheHit?: boolean;
    }): void;
    getHealth(): HealthStatus;
    getMetrics(): MetricsData;
    private startHealthChecks;
    stopHealthChecks(): void;
    resetMetrics(): void;
}
