interface PerformanceMetric {
    timestamp: number;
    operation: string;
    duration: number;
    success: boolean;
    errorType?: string;
    tokenCount?: number;
    memoryUsage?: number;
    metadata?: Record<string, any>;
}
interface ServiceMetrics {
    totalCalls: number;
    successCount: number;
    errorCount: number;
    averageLatency: number;
    totalTokens: number;
    peakMemoryUsage: number;
}
export declare class PerformanceMonitor {
    private static instance;
    private metrics;
    private serviceMetrics;
    private readonly maxMetricsAge;
    private readonly maxMetricsCount;
    private constructor();
    static getInstance(): PerformanceMonitor;
    recordMetric(operation: string, duration: number, success: boolean, options?: {
        errorType?: string;
        tokenCount?: number;
        metadata?: Record<string, any>;
    }): void;
    private updateServiceMetrics;
    getServiceMetrics(service: string): ServiceMetrics;
    getAllMetrics(): Map<string, ServiceMetrics>;
    getRecentMetrics(timeWindowMs?: number): PerformanceMetric[];
    getErrorMetrics(timeWindowMs?: number): {
        errorCount: number;
        errorTypes: Map<string, number>;
        errorRate: number;
    };
    getPerformanceReport(): string;
    getLatencyPercentiles(): {
        p50: number;
        p90: number;
        p95: number;
        p99: number;
    };
    private cleanup;
    getMemoryUsageTrend(): {
        current: number;
        peak: number;
        trend: Array<{
            timestamp: number;
            usage: number;
        }>;
    };
}
export {};
