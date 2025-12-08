// packages/bullmq/src/workerRegistry.ts
import type { JobData, JobProcessor } from "./types.js";

export class WorkerRegistry {
  private processors = new Map<string, JobProcessor>();
  private jobDefinitions: Array<{
    type: string;
    processor: JobProcessor;
    options?: {
      defaultRepeat?: string;
      defaultPriority?: number;
      attempts?: number;
    };
  }> = [];

  /**
   * Register a job processor with optional default configuration
   */
  register<T = any>(
    type: string,
    processor: JobProcessor<T>,
    options?: {
      defaultRepeat?: string;
      defaultPriority?: number;
      attempts?: number;
    },
  ) {
    this.processors.set(type, processor);
    this.jobDefinitions.push({ type, processor, options });
  }

  /**
   * Get all registered job definitions
   */
  getJobDefinitions() {
    return this.jobDefinitions;
  }

  /**
   * Get processor for a specific job type
   */
  getProcessor(type: string): JobProcessor | undefined {
    return this.processors.get(type);
  }

  /**
   * Check if processor exists
   */
  hasProcessor(type: string): boolean {
    return this.processors.has(type);
  }
}

// Global registry instance
export const workerRegistry = new WorkerRegistry();
