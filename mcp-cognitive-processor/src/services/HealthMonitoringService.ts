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

export class HealthMonitoringService extends EventEmitter {
  private static instance: HealthMonitoringService;
  private health: HealthStatus;
  private metrics: MetricsData;
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.health = this.initializeHealth();
    this.metrics = this.initializeMetrics();
    this.startHealthChecks();
  }

  public static getInstance(): HealthMonitoringService {
    if (!HealthMonitoringService.instance) {
      HealthMonitoringService.instance = new HealthMonitoringService();
    }
    return HealthMonitoringService.instance;
  }

  private initializeHealth(): HealthStatus {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      details: {}
    };
  }

  private initializeMetrics(): MetricsData {
    return {
      requestCount: 0,
      averageResponseTime: 0,
      errorRate: 0,
      tokenUsage: 0,
      cacheHitRate: 0,
      serviceMetrics: {}
    };
  }

  public async checkServiceHealth(serviceName: string): Promise<void> {
    try {
      const startTime = Date.now();
      // Implement actual health check logic here
      const responseTime = Date.now() - startTime;

      this.health.details[serviceName] = {
        status: 'up',
        lastCheck: new Date().toISOString(),
        responseTime
      };
    } catch (error) {
      this.health.details[serviceName] = {
        status: 'down',
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    this.updateOverallHealth();
  }

  private updateOverallHealth(): void {
    const services = Object.values(this.health.details);
    const downServices = services.filter(s => s.status === 'down');
    const degradedServices = services.filter(s => s.status === 'degraded');

    if (downServices.length > 0) {
      this.health.status = 'unhealthy';
    } else if (degradedServices.length > 0) {
      this.health.status = 'degraded';
    } else {
      this.health.status = 'healthy';
    }

    this.health.timestamp = new Date().toISOString();
    this.emit('healthUpdate', this.health);
  }

  public recordMetrics(serviceName: string, {
    responseTime,
    isError = false,
    tokenCount = 0,
    isCacheHit = false
  }: {
    responseTime: number;
    isError?: boolean;
    tokenCount?: number;
    isCacheHit?: boolean;
  }): void {
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
    if (isError) serviceMetrics.errors++;
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

  public getHealth(): HealthStatus {
    return { ...this.health };
  }

  public getMetrics(): MetricsData {
    return { ...this.metrics };
  }

  private startHealthChecks(): void {
    this.checkInterval = setInterval(() => {
      Object.keys(this.health.details).forEach(serviceName => {
        this.checkServiceHealth(serviceName);
      });
    }, 60000); // Check every minute
  }

  public stopHealthChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval as NodeJS.Timeout);
    }
  }

  public resetMetrics(): void {
    this.metrics = this.initializeMetrics();
  }
}