export class TokenOptimizationMonitor {
    static instance;
    metrics = [];
    modelStats = new Map();
    constructor() { }
    static getInstance() {
        if (!TokenOptimizationMonitor.instance) {
            TokenOptimizationMonitor.instance = new TokenOptimizationMonitor();
        }
        return TokenOptimizationMonitor.instance;
    }
    recordOptimization(originalTokens, optimizedTokens, model, context) {
        const metric = {
            timestamp: Date.now(),
            originalTokens,
            optimizedTokens,
            savings: originalTokens - optimizedTokens,
            model,
            context
        };
        this.metrics.push(metric);
        this.updateModelStats(metric);
        this.pruneOldMetrics();
    }
    updateModelStats(metric) {
        const stats = this.modelStats.get(metric.model) || {
            totalSavings: 0,
            totalOptimizations: 0,
            averageSavingsPercent: 0
        };
        stats.totalSavings += metric.savings;
        stats.totalOptimizations++;
        stats.averageSavingsPercent = (stats.totalSavings / stats.totalOptimizations) / 100;
        this.modelStats.set(metric.model, stats);
    }
    pruneOldMetrics() {
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        this.metrics = this.metrics.filter(m => m.timestamp > oneWeekAgo);
    }
    getModelStats(model) {
        return this.modelStats.get(model) || {
            totalSavings: 0,
            totalOptimizations: 0,
            averageSavingsPercent: 0
        };
    }
    getAllModelStats() {
        return new Map(this.modelStats);
    }
    getRecentMetrics(hours = 24) {
        const cutoff = Date.now() - (hours * 60 * 60 * 1000);
        return this.metrics.filter(m => m.timestamp > cutoff);
    }
    getOptimizationTrends() {
        const now = Date.now();
        const hourly = [];
        const daily = [];
        // Calculate hourly trends for the last 24 hours
        for (let i = 0; i < 24; i++) {
            const hourStart = now - ((i + 1) * 60 * 60 * 1000);
            const hourEnd = now - (i * 60 * 60 * 1000);
            const hourMetrics = this.metrics.filter(m => m.timestamp >= hourStart && m.timestamp < hourEnd);
            if (hourMetrics.length > 0) {
                const totalSavings = hourMetrics.reduce((sum, m) => sum + m.savings, 0);
                hourly.unshift({
                    timestamp: hourStart,
                    optimizationCount: hourMetrics.length,
                    tokensSaved: totalSavings,
                    averageSavings: totalSavings / hourMetrics.length
                });
            }
        }
        // Calculate daily trends for the last 7 days
        for (let i = 0; i < 7; i++) {
            const dayStart = now - ((i + 1) * 24 * 60 * 60 * 1000);
            const dayEnd = now - (i * 24 * 60 * 60 * 1000);
            const dayMetrics = this.metrics.filter(m => m.timestamp >= dayStart && m.timestamp < dayEnd);
            if (dayMetrics.length > 0) {
                const totalSavings = dayMetrics.reduce((sum, m) => sum + m.savings, 0);
                daily.unshift({
                    timestamp: dayStart,
                    optimizationCount: dayMetrics.length,
                    tokensSaved: totalSavings,
                    averageSavings: totalSavings / dayMetrics.length
                });
            }
        }
        return { hourly, daily };
    }
    getContextualPerformance() {
        const contextStats = new Map();
        // Calculate stats for each context
        for (const metric of this.metrics) {
            if (!metric.context)
                continue;
            const stats = contextStats.get(metric.context) || {
                optimizations: 0,
                totalSavings: 0,
                modelSavings: new Map()
            };
            stats.optimizations++;
            stats.totalSavings += metric.savings;
            const modelSavings = stats.modelSavings.get(metric.model) || 0;
            stats.modelSavings.set(metric.model, modelSavings + metric.savings);
            contextStats.set(metric.context, stats);
        }
        // Transform stats into final format
        const result = new Map();
        for (const [context, stats] of contextStats.entries()) {
            let bestModel = '';
            let bestSavings = 0;
            // Find best performing model for this context
            for (const [model, savings] of stats.modelSavings.entries()) {
                if (savings > bestSavings) {
                    bestSavings = savings;
                    bestModel = model;
                }
            }
            result.set(context, {
                optimizations: stats.optimizations,
                averageSavings: stats.totalSavings / stats.optimizations,
                bestModel
            });
        }
        return result;
    }
    generateOptimizationReport() {
        const stats = this.getAllModelStats();
        const trends = this.getOptimizationTrends();
        const contextPerf = this.getContextualPerformance();
        let report = '=== Token Optimization Performance Report ===\n\n';
        // Overall stats
        let totalSavings = 0;
        let totalOptimizations = 0;
        for (const [model, modelStats] of stats) {
            totalSavings += modelStats.totalSavings;
            totalOptimizations += modelStats.totalOptimizations;
            report += `Model ${model}:\n`;
            report += `  Total optimizations: ${modelStats.totalOptimizations}\n`;
            report += `  Total tokens saved: ${modelStats.totalSavings}\n`;
            report += `  Average savings: ${modelStats.averageSavingsPercent.toFixed(2)}%\n\n`;
        }
        // Recent trends
        report += '24-Hour Trend:\n';
        trends.hourly.slice(-5).forEach(hour => {
            report += `  ${new Date(hour.timestamp).toLocaleTimeString()}: ${hour.tokensSaved} tokens saved\n`;
        });
        // Context performance
        report += '\nContext Performance:\n';
        for (const [context, perf] of contextPerf) {
            report += `  ${context}:\n`;
            report += `    Optimizations: ${perf.optimizations}\n`;
            report += `    Avg savings: ${perf.averageSavings.toFixed(2)} tokens\n`;
            report += `    Best model: ${perf.bestModel}\n`;
        }
        report += '\nSummary:\n';
        report += `Total tokens saved: ${totalSavings}\n`;
        report += `Total optimizations: ${totalOptimizations}\n`;
        report += `Overall average savings: ${(totalSavings / totalOptimizations).toFixed(2)} tokens\n`;
        return report;
    }
}
//# sourceMappingURL=TokenOptimizationMonitor.js.map