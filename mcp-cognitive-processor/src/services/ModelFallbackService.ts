import { IAIService } from '../interfaces/IAIService.js';
import { HealthMonitoringService } from './HealthMonitoringService.js';
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

export class ModelFallbackService extends EventEmitter {
  private static instance: ModelFallbackService;
  private healthMonitor: HealthMonitoringService;
  private config: FallbackConfig;
  private providerStats: Map<string, {
    failures: number;
    successes: number;
    avgResponseTime: number;
    lastSuccess: number;
  }>;
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor(config: Partial<FallbackConfig> = {}) {
    super();
    this.healthMonitor = HealthMonitoringService.getInstance();
    this.providerStats = new Map();
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      healthCheckInterval: 60000,
      providers: [],
      ...config
    };
    this.startHealthChecks();
  }

  public static getInstance(config?: Partial<FallbackConfig>): ModelFallbackService {
    if (!ModelFallbackService.instance) {
      ModelFallbackService.instance = new ModelFallbackService(config);
    }
    return ModelFallbackService.instance;
  }

  public registerProvider(
    name: string,
    service: IAIService,
    priority: number = 0,
    weight: number = 1,
    maxTimeout: number = 30000
  ): void {
    this.config.providers.push({ name, service, priority, weight, maxTimeout });
    this.providerStats.set(name, {
      failures: 0,
      successes: 0,
      avgResponseTime: 0,
      lastSuccess: Date.now()
    });
    this.sortProviders();
  }

  private sortProviders(): void {
    this.config.providers.sort((a, b) => {
      // First by priority
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      
      // Then by success rate
      const aStats = this.providerStats.get(a.name);
      const bStats = this.providerStats.get(b.name);
      
      if (aStats && bStats) {
        const aSuccessRate = aStats.successes / (aStats.successes + aStats.failures);
        const bSuccessRate = bStats.successes / (bStats.successes + bStats.failures);
        if (aSuccessRate !== bSuccessRate) {
          return bSuccessRate - aSuccessRate;
        }
      }
      
      // Finally by weight
      return b.weight - a.weight;
    });
  }

  public async query(data: any): Promise<any> {
    let lastError: Error | null = null;
    
    for (let retry = 0; retry < this.config.maxRetries; retry++) {
      for (const provider of this.config.providers) {
        try {
          const startTime = Date.now();
          const result = await Promise.race([
            provider.service.query(data),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Provider timeout')), provider.maxTimeout)
            )
          ]);

          // Update stats on success
          const stats = this.providerStats.get(provider.name);
          if (stats) {
            stats.successes++;
            stats.lastSuccess = Date.now();
            stats.avgResponseTime = (stats.avgResponseTime * (stats.successes - 1) + 
              (Date.now() - startTime)) / stats.successes;
          }

          this.emit('querySuccess', {
            provider: provider.name,
            responseTime: Date.now() - startTime
          });

          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          
          // Update stats on failure
          const stats = this.providerStats.get(provider.name);
          if (stats) {
            stats.failures++;
          }

          this.emit('queryError', {
            provider: provider.name,
            error: lastError.message
          });

          // Log the failure
          console.error(`Provider ${provider.name} failed:`, lastError);
          
          // Continue to next provider
          continue;
        }
      }

      // If we get here, all providers failed
      if (retry < this.config.maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retry) * 1000));
        this.sortProviders(); // Re-sort providers before retry
      }
    }

    // If we get here, all retries failed
    throw new Error(`All providers failed after ${this.config.maxRetries} retries. Last error: ${lastError?.message}`);
  }

  private async checkProviderHealth(provider: FallbackConfig['providers'][0]): Promise<void> {
    try {
      // Simple health check query
      await provider.service.query({ type: 'health_check', inputs: 'test' });
      
      this.healthMonitor.checkServiceHealth(provider.name);
      
      const stats = this.providerStats.get(provider.name);
      if (stats) {
        stats.lastSuccess = Date.now();
      }
    } catch (error) {
      console.error(`Health check failed for provider ${provider.name}:`, error);
    }
  }

  private startHealthChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.config.providers.forEach(provider => {
        this.checkProviderHealth(provider).catch(console.error);
      });
    }, this.config.healthCheckInterval);
  }

  public getProviderStats(): Map<string, {
    failures: number;
    successes: number;
    avgResponseTime: number;
    lastSuccess: number;
  }> {
    return new Map(this.providerStats);
  }

  public getActiveProviders(): string[] {
    return this.config.providers.map(p => p.name);
  }

  public removeProvider(name: string): void {
    const index = this.config.providers.findIndex(p => p.name === name);
    if (index !== -1) {
      this.config.providers.splice(index, 1);
      this.providerStats.delete(name);
    }
  }

  public clearStats(): void {
    this.providerStats.clear();
    this.config.providers.forEach(provider => {
      this.providerStats.set(provider.name, {
        failures: 0,
        successes: 0,
        avgResponseTime: 0,
        lastSuccess: Date.now()
      });
    });
  }
}