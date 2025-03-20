import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import { HealthMonitoringService } from './HealthMonitoringService.js';
import { CachingService } from './CachingService.js';
export class ProcessingService extends EventEmitter {
    static instance;
    batchJobs;
    activeStreams;
    healthMonitor;
    cacheService;
    maxConcurrentJobs;
    activeJobs;
    constructor() {
        super();
        this.batchJobs = new Map();
        this.activeStreams = new Map();
        this.healthMonitor = HealthMonitoringService.getInstance();
        this.cacheService = CachingService.getInstance();
        this.maxConcurrentJobs = 5;
        this.activeJobs = 0;
    }
    static getInstance() {
        if (!ProcessingService.instance) {
            ProcessingService.instance = new ProcessingService();
        }
        return ProcessingService.instance;
    }
    async submitBatch(items, processor, options = {}) {
        const jobId = crypto.randomUUID();
        const batchJob = {
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
    async processBatch(jobId, processor, options) {
        const job = this.batchJobs.get(jobId);
        if (!job)
            return;
        const batchSize = options.batchSize || 10;
        const retryAttempts = options.retryAttempts || 3;
        const shouldCache = options.cacheResults ?? true;
        try {
            this.activeJobs++;
            job.status = 'processing';
            // Process items in batches
            for (let i = 0; i < job.items.length; i += batchSize) {
                const batch = job.items.slice(i, i + batchSize);
                const batchResults = await Promise.all(batch.map(item => this.processWithRetry(item, processor, retryAttempts, shouldCache)));
                job.results.push(...batchResults);
                job.progress = (i + batch.length) / job.items.length * 100;
                this.emit('batchProgress', { jobId, progress: job.progress });
            }
            job.status = 'completed';
            this.emit('batchCompleted', { jobId, results: job.results });
        }
        catch (error) {
            job.status = 'failed';
            job.error = error instanceof Error ? error.message : 'Unknown error';
            this.emit('batchError', { jobId, error: job.error });
        }
        finally {
            this.activeJobs--;
            this.processNextBatch();
        }
    }
    async processWithRetry(item, processor, retryAttempts, useCache) {
        if (useCache) {
            const cacheKey = this.generateCacheKey(item);
            const cachedResult = await this.cacheService.get(cacheKey);
            if (cachedResult)
                return cachedResult;
        }
        let lastError = null;
        for (let attempt = 0; attempt < retryAttempts; attempt++) {
            try {
                const result = await processor(item);
                if (useCache) {
                    const cacheKey = this.generateCacheKey(item);
                    await this.cacheService.set(cacheKey, result);
                }
                return result;
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (attempt < retryAttempts - 1) {
                    await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
                }
            }
        }
        throw lastError || new Error('Processing failed after all retry attempts');
    }
    async createStream(generator, options = {}) {
        const streamId = crypto.randomUUID();
        const stream = this.processStream(generator, options);
        this.activeStreams.set(streamId, {
            id: streamId,
            stream,
            status: 'active'
        });
        return streamId;
    }
    async *processStream(generator, options) {
        const timeout = options.timeout || 30000; // 30 seconds default
        const maxBufferSize = options.maxBufferSize || 1000;
        const buffer = [];
        try {
            while (true) {
                const result = await Promise.race([
                    generator.next(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Stream timeout')), timeout))
                ]);
                if (result.done)
                    break;
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
        }
        catch (error) {
            console.error('Stream processing error:', error);
            throw error;
        }
    }
    async consumeStream(streamId) {
        const streamData = this.activeStreams.get(streamId);
        if (!streamData) {
            throw new Error(`Stream not found: ${streamId}`);
        }
        return {
            [Symbol.asyncIterator]() {
                return streamData.stream;
            }
        };
    }
    generateCacheKey(data) {
        const stringData = typeof data === 'string' ? data : JSON.stringify(data);
        return crypto.createHmac('sha256', 'mcp-cache-key').update(stringData).digest('hex');
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    processNextBatch() {
        if (this.activeJobs >= this.maxConcurrentJobs)
            return;
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
    getBatchStatus(jobId) {
        return this.batchJobs.get(jobId) || null;
    }
    getStreamStatus(streamId) {
        return this.activeStreams.get(streamId) || null;
    }
}
//# sourceMappingURL=ProcessingService.js.map