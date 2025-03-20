export class PerformanceMonitor {
    static instance;
    metrics = [];
    serviceMetrics = new Map();
    maxMetricsAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    maxMetricsCount = 10000;
    constructor() {
        // Start periodic cleanup
        setInterval(() => this.cleanup(), 60 * 60 * 1000); // Every hour
    }
    static getInstance() {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }
    recordMetric(operation, duration, success, options) {
        const metric = {
            timestamp: Date.now(),
            operation,
            duration,
            success,
            errorType: options?.errorType,
            tokenCount: options?.tokenCount,
            memoryUsage: process.memoryUsage().heapUsed,
            metadata: options?.metadata
        };
        this.metrics.push(metric);
        this.updateServiceMetrics(metric);
    }
    updateServiceMetrics(metric) {
        const existing = this.serviceMetrics.get(metric.operation) || {
            totalCalls: 0,
            successCount: 0,
            errorCount: 0,
            averageLatency: 0,
            totalTokens: 0,
            peakMemoryUsage: 0
        };
        // Update metrics
        existing.totalCalls++;
        if (metric.success) {
            existing.successCount++;
        }
        else {
            existing.errorCount++;
        }
        // Update average latency using moving average
        existing.averageLatency = (existing.averageLatency * (existing.totalCalls - 1) + metric.duration) / existing.totalCalls;
        if (metric.tokenCount) {
            existing.totalTokens += metric.tokenCount;
        }
        if (metric.memoryUsage && metric.memoryUsage > existing.peakMemoryUsage) {
            existing.peakMemoryUsage = metric.memoryUsage;
        }
        this.serviceMetrics.set(metric.operation, existing);
    }
    getServiceMetrics(service) {
        return this.serviceMetrics.get(service) || {
            totalCalls: 0,
            successCount: 0,
            errorCount: 0,
            averageLatency: 0,
            totalTokens: 0,
            peakMemoryUsage: 0
        };
    }
    getAllMetrics() {
        return new Map(this.serviceMetrics);
    }
    getRecentMetrics(timeWindowMs = 3600000) {
        const cutoff = Date.now() - timeWindowMs;
        return this.metrics.filter(m => m.timestamp >= cutoff);
    }
    getErrorMetrics(timeWindowMs) {
        const metrics = timeWindowMs ? this.getRecentMetrics(timeWindowMs) : this.metrics;
        const errorMetrics = metrics.filter(m => !m.success);
        const errorTypes = new Map();
        errorMetrics.forEach(m => {
            if (m.errorType) {
                const count = errorTypes.get(m.errorType) || 0;
                errorTypes.set(m.errorType, count + 1);
            }
        });
        return {
            errorCount: errorMetrics.length,
            errorTypes,
            errorRate: metrics.length > 0 ? errorMetrics.length / metrics.length : 0
        };
    }
    getPerformanceReport() {
        let report = '=== Performance Monitoring Report ===\n\n';
        // Overall statistics
        const totalMetrics = this.metrics.length;
        const successfulMetrics = this.metrics.filter(m => m.success).length;
        const overallSuccessRate = (successfulMetrics / totalMetrics) * 100;
        report += `Overall Statistics:\n`;
        report += `Total Operations: ${totalMetrics}\n`;
        report += `Success Rate: ${overallSuccessRate.toFixed(2)}%\n\n`;
        // Service-specific metrics
        report += 'Service Performance:\n';
        for (const [service, metrics] of this.serviceMetrics.entries()) {
            report += `\n${service}:\n`;
            report += `  Total Calls: ${metrics.totalCalls}\n`;
            report += `  Success Rate: ${((metrics.successCount / metrics.totalCalls) * 100).toFixed(2)}%\n`;
            report += `  Average Latency: ${metrics.averageLatency.toFixed(2)}ms\n`;
            if (metrics.totalTokens > 0) {
                report += `  Total Tokens: ${metrics.totalTokens}\n`;
            }
            report += `  Peak Memory Usage: ${(metrics.peakMemoryUsage / 1024 / 1024).toFixed(2)}MB\n`;
        }
        // Error analysis
        const errorMetrics = this.getErrorMetrics();
        report += '\nError Analysis:\n';
        report += `Overall Error Rate: ${(errorMetrics.errorRate * 100).toFixed(2)}%\n`;
        report += 'Error Types:\n';
        errorMetrics.errorTypes.forEach((count, type) => {
            report += `  ${type}: ${count} occurrences\n`;
        });
        // Recent performance trends
        const recentMetrics = this.getRecentMetrics(3600000); // Last hour
        const recentAvgLatency = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;
        report += '\nRecent Performance (Last Hour):\n';
        report += `Operations: ${recentMetrics.length}\n`;
        report += `Average Latency: ${recentAvgLatency.toFixed(2)}ms\n`;
        return report;
    }
    getLatencyPercentiles() {
        if (this.metrics.length === 0) {
            return { p50: 0, p90: 0, p95: 0, p99: 0 };
        }
        const sortedLatencies = this.metrics
            .map(m => m.duration)
            .sort((a, b) => a - b);
        const getPercentile = (p) => {
            const index = Math.ceil((p / 100) * sortedLatencies.length) - 1;
            return sortedLatencies[index];
        };
        return {
            p50: getPercentile(50),
            p90: getPercentile(90),
            p95: getPercentile(95),
            p99: getPercentile(99)
        };
    }
    cleanup() {
        const now = Date.now();
        // Remove old metrics
        this.metrics = this.metrics.filter(m => now - m.timestamp <= this.maxMetricsAge);
        // Trim to max count if still too large
        if (this.metrics.length > this.maxMetricsCount) {
            this.metrics = this.metrics.slice(-this.maxMetricsCount);
        }
        // Recalculate service metrics
        this.serviceMetrics.clear();
        this.metrics.forEach(metric => this.updateServiceMetrics(metric));
    }
    getMemoryUsageTrend() {
        const recentMetrics = this.getRecentMetrics(3600000); // Last hour
        const trend = recentMetrics
            .filter(m => m.memoryUsage !== undefined)
            .map(m => ({
            timestamp: m.timestamp,
            usage: m.memoryUsage
        }));
        return {
            current: process.memoryUsage().heapUsed,
            peak: Math.max(...trend.map(t => t.usage)),
            trend
        };
    }
}
//# sourceMappingURL=PerformanceMonitor.js.map