import { EventEmitter } from 'events';
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
export declare class ProcessingService extends EventEmitter {
    private static instance;
    private batchJobs;
    private activeStreams;
    private healthMonitor;
    private cacheService;
    private maxConcurrentJobs;
    private activeJobs;
    private constructor();
    static getInstance(): ProcessingService;
    submitBatch<T>(items: T[], processor: (item: T) => Promise<any>, options?: {
        batchSize?: number;
        retryAttempts?: number;
        cacheResults?: boolean;
    }): Promise<string>;
    private processBatch;
    private processWithRetry;
    createStream<T>(generator: AsyncGenerator<T>, options?: {
        timeout?: number;
        maxBufferSize?: number;
    }): Promise<string>;
    private processStream;
    consumeStream<T>(streamId: string): Promise<AsyncIterableIterator<T>>;
    private generateCacheKey;
    private delay;
    private processNextBatch;
    getBatchStatus(jobId: string): BatchJob<any> | null;
    getStreamStatus(streamId: string): StreamingResponse | null;
}
export {};
