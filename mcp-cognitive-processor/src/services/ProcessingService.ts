import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import { HealthMonitoringService } from './HealthMonitoringService.js';
import { CachingService } from './CachingService.js';

interface BatchJob<T, R = any> {
  id: string;
  items: T[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results: R[];
  error?: string;
  timestamp: number;
  progress: number;
  processor: (item: T) => Promise<R>;
  options: {
    batchSize?: number;
    retryAttempts?: number;
    cacheResults?: boolean;
  };
}

interface StreamingResponse {
  id: string;
  stream: AsyncIterator<any>;
  status: 'active' | 'completed' | 'error';
  error?: string;
}

export class ProcessingService extends EventEmitter {
  private static instance: ProcessingService;
  private batchJobs: Map<string, BatchJob<any>>;
  private activeStreams: Map<string, StreamingResponse>;
  private healthMonitor: HealthMonitoringService;
  private cacheService: CachingService;
  private maxConcurrentJobs: number;
  private activeJobs: number;

  private constructor() {
    super();
    this.batchJobs = new Map();
    this.activeStreams = new Map();
    this.healthMonitor = HealthMonitoringService.getInstance();
    this.cacheService = CachingService.getInstance();
    this.maxConcurrentJobs = 5;
    this.activeJobs = 0;
  }

  public static getInstance(): ProcessingService {
    if (!ProcessingService.instance) {
      ProcessingService.instance = new ProcessingService();
    }
    return ProcessingService.instance;
  }

  public async submitBatch<T>(
    items: T[],
    processor: (item: T) => Promise<any>,
    options: {
      batchSize?: number;
      retryAttempts?: number;
      cacheResults?: boolean;
    } = {}
  ): Promise<string> {
    const jobId = crypto.randomUUID();
    const batchJob: BatchJob<T> = {
      id: jobId,
      items,
      status: 'pending',
      results: [],
      timestamp: Date.now(),
      progress: 0,
      processor,
      options
    };

    this.batchJobs.set(jobId, batchJob);
    this.emit('batchSubmitted', { jobId, itemCount: items.length });

    // Start processing if we haven't reached max concurrent jobs
    if (this.activeJobs < this.maxConcurrentJobs) {
      this.processBatch(jobId, processor, options).catch(console.error);
    }

    return jobId;
  }

  private async processBatch<T>(
    jobId: string,
    processor: (item: T) => Promise<any>,
    options: {
      batchSize?: number;
      retryAttempts?: number;
      cacheResults?: boolean;
    }
  ): Promise<void> {
    const job = this.batchJobs.get(jobId);
    if (!job) return;

    const batchSize = options.batchSize || 10;
    const retryAttempts = options.retryAttempts || 3;
    const shouldCache = options.cacheResults ?? true;

    try {
      this.activeJobs++;
      job.status = 'processing';
      
      // Process items in batches
      for (let i = 0; i < job.items.length; i += batchSize) {
        const batch = job.items.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(item => this.processWithRetry(item, processor, retryAttempts, shouldCache))
        );

        job.results.push(...batchResults);
        job.progress = (i + batch.length) / job.items.length * 100;
        this.emit('batchProgress', { jobId, progress: job.progress });
      }

      job.status = 'completed';
      this.emit('batchCompleted', { jobId, results: job.results });
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      this.emit('batchError', { jobId, error: job.error });
    } finally {
      this.activeJobs--;
      this.processNextBatch();
    }
  }

  private async processWithRetry<T>(
    item: T,
    processor: (item: T) => Promise<any>,
    retryAttempts: number,
    useCache: boolean
  ): Promise<any> {
    if (useCache) {
      const cacheKey = this.generateCacheKey(item);
      const cachedResult = await this.cacheService.get(cacheKey);
      if (cachedResult) return cachedResult;
    }

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < retryAttempts; attempt++) {
      try {
        const result = await processor(item);
        
        if (useCache) {
          const cacheKey = this.generateCacheKey(item);
          await this.cacheService.set(cacheKey, result);
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < retryAttempts - 1) {
          await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
        }
      }
    }

    throw lastError || new Error('Processing failed after all retry attempts');
  }

  public async createStream<T>(
    generator: AsyncGenerator<T>,
    options: {
      timeout?: number;
      maxBufferSize?: number;
    } = {}
  ): Promise<string> {
    const streamId = crypto.randomUUID();
    
    const stream = this.processStream(generator, options);
    this.activeStreams.set(streamId, {
      id: streamId,
      stream,
      status: 'active'
    });

    return streamId;
  }

  private async *processStream<T>(
    generator: AsyncGenerator<T>,
    options: {
      timeout?: number;
      maxBufferSize?: number;
    }
  ): AsyncIterator<T> {
    const timeout = options.timeout || 30000; // 30 seconds default
    const maxBufferSize = options.maxBufferSize || 1000;
    const buffer: T[] = [];

    try {
      while (true) {
        const result = await Promise.race([
          generator.next(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Stream timeout')), timeout)
          )
        ]) as IteratorResult<T>;

        if (result.done) break;

        buffer.push(result.value);
        if (buffer.length >= maxBufferSize) {
          yield* buffer;
          buffer.length = 0;
        }
      }

      // Yield remaining items in buffer
      if (buffer.length > 0) {
        yield* buffer;
      }
    } catch (error) {
      console.error('Stream processing error:', error);
      throw error;
    }
  }

  public async consumeStream<T>(streamId: string): Promise<AsyncIterableIterator<T>> {
    const streamData = this.activeStreams.get(streamId);
    if (!streamData) {
      throw new Error(`Stream not found: ${streamId}`);
    }

    return {
      [Symbol.asyncIterator]() {
        return streamData.stream;
      }
    } as AsyncIterableIterator<T>;
  }

  private generateCacheKey(data: any): string {
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHmac('sha256', 'mcp-cache-key').update(stringData).digest('hex');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private processNextBatch(): void {
    if (this.activeJobs >= this.maxConcurrentJobs) return;

    // Find the oldest pending job
    const pendingJobs = Array.from(this.batchJobs.entries())
      .filter(([_, job]) => job.status === 'pending')
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    if (pendingJobs.length > 0) {
      const [jobId, job] = pendingJobs[0];
      // Start processing the next batch
      this.processBatch(jobId, job.processor, job.options).catch(console.error);
    }
  }

  public getBatchStatus(jobId: string): BatchJob<any> | null {
    return this.batchJobs.get(jobId) || null;
  }

  public getStreamStatus(streamId: string): StreamingResponse | null {
    return this.activeStreams.get(streamId) || null;
  }
}