/**
 * Metrics Service
 * Provides system-wide metrics collection, analysis, and reporting
 */
export interface MetricPoint {
    timestamp: string;
    value: number;
}
export interface MetricSeries {
    name: string;
    points: MetricPoint[];
    metadata?: Record<string, string>;
}
export interface PerformanceMetrics {
    tokenUsage: MetricSeries[];
    memoryUsage: MetricSeries[];
    responseTime: MetricSeries[];
    modelAccuracy: MetricSeries[];
    lastUpdated: string;
}
/**
 * Records a metric data point
 * @param category - The metric category
 * @param name - The metric name
 * @param value - The metric value
 * @param metadata - Optional metadata for the series
 */
export declare const recordMetric: (category: keyof PerformanceMetrics, name: string, value: number, metadata?: Record<string, string>) => void;
/**
 * Gets metrics for a specific category
 * @param category - The metric category
 * @returns Array of metric series
 */
export declare const getMetrics: (category: keyof PerformanceMetrics) => MetricSeries[];
/**
 * Gets a statistical summary for a specific metric series
 * @param category - The metric category
 * @param name - The metric name
 * @returns Statistical summary or null if not found
 */
export declare const getMetricStats: (category: keyof PerformanceMetrics, name: string) => {
    min: number;
    max: number;
    avg: number;
    median: number;
} | null;
/**
 * Saves metrics to disk
 */
export declare const saveMetrics: () => void;
/**
 * Performs maintenance on metrics data
 * @returns Number of series pruned
 */
export declare const performMetricsMaintenance: () => number;
declare const _default: {
    recordMetric: (category: keyof PerformanceMetrics, name: string, value: number, metadata?: Record<string, string>) => void;
    getMetrics: (category: keyof PerformanceMetrics) => MetricSeries[];
    getMetricStats: (category: keyof PerformanceMetrics, name: string) => {
        min: number;
        max: number;
        avg: number;
        median: number;
    } | null;
    saveMetrics: () => void;
    performMetricsMaintenance: () => number;
};
export default _default;
