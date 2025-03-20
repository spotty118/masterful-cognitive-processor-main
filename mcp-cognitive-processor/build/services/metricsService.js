/**
 * Metrics Service
 * Provides system-wide metrics collection, analysis, and reporting
 */
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
// Constants
const METRICS_DIR = process.env.METRICS_DIR || path.join(process.cwd(), 'data', 'metrics');
const METRICS_FILE = path.join(METRICS_DIR, 'system_metrics.json');
const MAX_SERIES_LENGTH = 1000; // Maximum number of points per series
// Ensure metrics directory exists
if (!fs.existsSync(METRICS_DIR)) {
    fs.mkdirSync(METRICS_DIR, { recursive: true });
}
// Initialize metrics storage
let metrics = {
    tokenUsage: [],
    memoryUsage: [],
    responseTime: [],
    modelAccuracy: [],
    lastUpdated: new Date().toISOString()
};
// Load existing metrics if available
try {
    if (fs.existsSync(METRICS_FILE)) {
        const data = fs.readFileSync(METRICS_FILE, 'utf8');
        metrics = JSON.parse(data);
    }
}
catch (error) {
    console.error('Error loading metrics:', error);
    // Continue with empty metrics
}
/**
 * Records a metric data point
 * @param category - The metric category
 * @param name - The metric name
 * @param value - The metric value
 * @param metadata - Optional metadata for the series
 */
export const recordMetric = (category, name, value, metadata) => {
    if (!(category in metrics)) {
        console.error(`Invalid metric category: ${category}`);
        return;
    }
    // Find or create the series
    let series = metrics[category].find(s => s.name === name);
    if (!series) {
        series = {
            name,
            points: [],
            metadata
        };
        metrics[category].push(series);
    }
    else if (metadata) {
        // Update metadata if provided
        series.metadata = { ...series.metadata, ...metadata };
    }
    // Add new point
    series.points.push({
        timestamp: new Date().toISOString(),
        value
    });
    // Limit series length to prevent unbounded growth
    if (series.points.length > MAX_SERIES_LENGTH) {
        // Keep most recent points
        series.points = series.points.slice(-MAX_SERIES_LENGTH);
    }
    metrics.lastUpdated = new Date().toISOString();
    // Periodically save metrics to disk
    // Use a hash of the timestamp to avoid saving too frequently
    const timestampHash = createHash('md5')
        .update(new Date().toISOString())
        .digest('hex');
    if (parseInt(timestampHash.slice(0, 2), 16) < 10) { // ~4% chance of saving
        saveMetrics();
    }
};
/**
 * Gets metrics for a specific category
 * @param category - The metric category
 * @returns Array of metric series
 */
export const getMetrics = (category) => {
    return metrics[category] || [];
};
/**
 * Gets a statistical summary for a specific metric series
 * @param category - The metric category
 * @param name - The metric name
 * @returns Statistical summary or null if not found
 */
export const getMetricStats = (category, name) => {
    const series = metrics[category]?.find(s => s.name === name);
    if (!series || series.points.length === 0) {
        return null;
    }
    const values = series.points.map(p => p.value);
    values.sort((a, b) => a - b);
    return {
        min: values[0],
        max: values[values.length - 1],
        avg: values.reduce((sum, val) => sum + val, 0) / values.length,
        median: values[Math.floor(values.length / 2)]
    };
};
/**
 * Saves metrics to disk
 */
export const saveMetrics = () => {
    try {
        fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2));
    }
    catch (error) {
        console.error('Error saving metrics:', error);
    }
};
/**
 * Performs maintenance on metrics data
 * @returns Number of series pruned
 */
export const performMetricsMaintenance = () => {
    try {
        let prunedCount = 0;
        // Remove old points from all series
        for (const category of Object.keys(metrics)) {
            if (category === 'lastUpdated')
                continue;
            for (const series of metrics[category]) {
                const oldLength = series.points.length;
                // Keep points from last 30 days, plus one point per month for older data
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                // Points to definitely keep (last 30 days)
                const recentPoints = series.points.filter(point => new Date(point.timestamp) >= thirtyDaysAgo);
                // For older points, keep one per month
                const olderPoints = series.points.filter(point => new Date(point.timestamp) < thirtyDaysAgo);
                // Group older points by month
                const pointsByMonth = {};
                olderPoints.forEach(point => {
                    const date = new Date(point.timestamp);
                    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
                    if (!pointsByMonth[monthKey]) {
                        pointsByMonth[monthKey] = [];
                    }
                    pointsByMonth[monthKey].push(point);
                });
                // Keep median point from each month
                const sampledOlderPoints = [];
                Object.values(pointsByMonth).forEach(monthPoints => {
                    monthPoints.sort((a, b) => a.value - b.value);
                    const medianPoint = monthPoints[Math.floor(monthPoints.length / 2)];
                    sampledOlderPoints.push(medianPoint);
                });
                // Combine recent and sampled older points
                series.points = [...recentPoints, ...sampledOlderPoints];
                prunedCount += oldLength - series.points.length;
            }
        }
        metrics.lastUpdated = new Date().toISOString();
        saveMetrics();
        return prunedCount;
    }
    catch (error) {
        console.error('Error during metrics maintenance:', error);
        console.error(`Metrics file: ${METRICS_FILE}`);
        return 0;
    }
};
export default {
    recordMetric,
    getMetrics,
    getMetricStats,
    saveMetrics,
    performMetricsMaintenance
};
//# sourceMappingURL=metricsService.js.map