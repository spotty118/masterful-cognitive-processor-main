import { EventEmitter } from 'events';
export class HealthMonitoringService extends EventEmitter {
    static instance;
    health;
    metrics;
    checkInterval = null;
    constructor() {
        super();
        this.health = this.initializeHealth();
        this.metrics = this.initializeMetrics();
        this.startHealthChecks();
    }
    static getInstance() {
        if (!HealthMonitoringService.instance) {
            HealthMonitoringService.instance = new HealthMonitoringService();
        }
        return HealthMonitoringService.instance;
    }
    initializeHealth() {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            details: {}
        };
    }
    initializeMetrics() {
        return {
            requestCount: 0,
            averageResponseTime: 0,
            errorRate: 0,
            tokenUsage: 0,
            cacheHitRate: 0,
            serviceMetrics: {}
        };
    }
    async checkServiceHealth(serviceName) {
        try {
            const startTime = Date.now();
            // Implement actual health check logic here
            const responseTime = Date.now() - startTime;
            this.health.details[serviceName] = {
                status: 'up',
                lastCheck: new Date().toISOString(),
                responseTime
            };
        }
        catch (error) {
            this.health.details[serviceName] = {
                status: 'down',
                lastCheck: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
        this.updateOverallHealth();
    }
    updateOverallHealth() {
        const services = Object.values(this.health.details);
        const downServices = services.filter(s => s.status === 'down');
        const degradedServices = services.filter(s => s.status === 'degraded');
        if (downServices.length > 0) {
            this.health.status = 'unhealthy';
        }
        else if (degradedServices.length > 0) {
            this.health.status = 'degraded';
        }
        else {
            this.health.status = 'healthy';
        }
        this.health.timestamp = new Date().toISOString();
        this.emit('healthUpdate', this.health);
    }
    recordMetrics(serviceName, { responseTime, isError = false, tokenCount = 0, isCacheHit = false }) {
        // Update service-specific metrics
        if (!this.metrics.serviceMetrics[serviceName]) {
            this.metrics.serviceMetrics[serviceName] = {
                requests: 0,
                errors: 0,
                totalResponseTime: 0
            };
        }
        const serviceMetrics = this.metrics.serviceMetrics[serviceName];
        serviceMetrics.requests++;
        if (isError)
            serviceMetrics.errors++;
        serviceMetrics.totalResponseTime += responseTime;
        // Update global metrics
        this.metrics.requestCount++;
        this.metrics.tokenUsage += tokenCount;
        this.metrics.averageResponseTime =
            Object.values(this.metrics.serviceMetrics)
                .reduce((total, metrics) => total + metrics.totalResponseTime, 0) /
                this.metrics.requestCount;
        this.metrics.errorRate =
            Object.values(this.metrics.serviceMetrics)
                .reduce((total, metrics) => total + metrics.errors, 0) /
                this.metrics.requestCount;
        if (isCacheHit) {
            const totalCacheAttempts = this.metrics.requestCount;
            const currentCacheHits = this.metrics.cacheHitRate * (totalCacheAttempts - 1);
            this.metrics.cacheHitRate = (currentCacheHits + 1) / totalCacheAttempts;
        }
        this.emit('metricsUpdate', this.metrics);
    }
    getHealth() {
        return { ...this.health };
    }
    getMetrics() {
        return { ...this.metrics };
    }
    startHealthChecks() {
        this.checkInterval = setInterval(() => {
            Object.keys(this.health.details).forEach(serviceName => {
                this.checkServiceHealth(serviceName);
            });
        }, 60000); // Check every minute
    }
    stopHealthChecks() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
    }
    resetMetrics() {
        this.metrics = this.initializeMetrics();
    }
}
//# sourceMappingURL=HealthMonitoringService.js.map