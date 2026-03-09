import { Queue, type QueueOptions, Worker } from "bullmq";
import IORedis from "ioredis";

import type {
  DefaultJobMap,
  JobData,
  TypedJobProcessor,
  WorkerContext,
} from "./types.js";
import { workerRegistry } from "./workerRegistry.js";

export interface WorkerFactoryConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  workerId?: string;
  concurrency?: number;
}

export type AddJobOptions = {
  delay?: number;
  repeat?: { pattern: string };
  priority?: number;
  attempts?: number;
  backoff?: string;
};

export class WorkerFactory {
  private workers: Map<string, Worker> = new Map();
  private queues: Map<string, Queue> = new Map();
  private connection: IORedis;

  constructor(private config: WorkerFactoryConfig) {
    this.connection = new IORedis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });
  }

  /**
   * Create worker for specific queue
   */
  createWorker(
    queueName: string,
    contextFactory: () => Promise<WorkerContext>,
    options: { concurrency?: number } = {},
  ): Worker {
    const worker = new Worker(
      queueName,
      async (job) => {
        const { type, metadata } = job.data as JobData;
        const processor = workerRegistry.getProcessor(type);

        if (!processor) {
          throw new Error(`No processor found for job type: ${type}`);
        }

        try {
          const context = await contextFactory();
          const result = await processor(job as any, context);

          context.logger("bullmq").info({
            title: `Job ${type} completed`,
            code: "BULLMQ_JOB_COMPLETE",
            jobId: job.id,
            duration: (job.finishedOn || 0) - (job.processedOn || 0),
            metadata,
          });

          return result;
        } catch (error) {
          console.error(`Error processing job ${type}:`, error);
          throw error;
        }
      },
      {
        connection: this.connection,
        concurrency: options.concurrency || this.config.concurrency || 1,
      },
    );

    worker.on("completed", (job) => {
      console.log(`✅ Job ${job.id} (${job.data.type}) completed`);
    });

    worker.on("failed", (job, err) => {
      console.error(`❌ Job ${job?.id} (${job?.data?.type}) failed:`, err);
    });

    worker.on("error", (err) => {
      console.error(`🚨 Worker error for ${queueName}:`, err);
    });

    this.workers.set(queueName, worker);
    return worker;
  }

  /**
   * Get queue instance
   */
  getQueue(queueName: string, options: QueueOptions = {}): Queue {
    if (!this.queues.has(queueName)) {
      const queue = new Queue(queueName, {
        connection: this.connection,
        ...options,
      });
      this.queues.set(queueName, queue);
    }
    return this.queues.get(queueName)!;
  }

  /**
   * Add job to queue
   */
  async addJob(
    queueName: string,
    type: string,
    data: unknown,
    options: AddJobOptions = {},
  ) {
    const queue = this.getQueue(queueName);
    const jobDef = workerRegistry
      .getJobDefinitions()
      .find((def) => def.type === type);

    const jobOptions = {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: options.attempts || jobDef?.options?.attempts || 3,
      backoff: {
        type: options.backoff || "exponential",
        delay: 2000,
      },
      delay: options.delay,
      repeat: options.repeat,
      priority: options.priority,
    };

    return await queue.add(type, { type, data }, jobOptions);
  }

  async addTypedJob<
    TJobMap extends DefaultJobMap,
    K extends keyof TJobMap & string,
  >(
    queueName: string,
    type: K,
    data: TJobMap[K]["data"],
    options: AddJobOptions = {},
  ) {
    return this.addJob(queueName, type, data, options);
  }

  registerTypedProcessor<
    TJobMap extends DefaultJobMap,
    K extends keyof TJobMap & string,
  >(
    type: K,
    processor: TypedJobProcessor<TJobMap, K>,
    options?: {
      defaultRepeat?: string;
      defaultPriority?: number;
      attempts?: number;
    },
  ) {
    workerRegistry.registerTyped(type, processor, options);
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    const shutdownPromises = Array.from(this.workers.values()).map((worker) =>
      worker.close(),
    );
    await Promise.all(shutdownPromises);

    const queueClosePromises = Array.from(this.queues.values()).map((queue) =>
      queue.close(),
    );
    await Promise.all(queueClosePromises);

    await this.connection.quit();
  }
}
