// packages/bullmq/src/jobDefinitions.ts
import type { JobProcessor } from "./types.js";
import { workerRegistry } from "./workerRegistry.js";

/**
 * Decorator for registering job processors
 */
export function RegisterJob(options: {
  type: string;
  defaultRepeat?: string;
  defaultPriority?: number;
  attempts?: number;
}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const processor = descriptor.value as JobProcessor;
    workerRegistry.register(options.type, processor, options);
  };
}

/**
 * Base class for job processors
 */
export abstract class BaseJobProcessor {
  abstract getType(): string;
  abstract process(job: any, context: any): Promise<any>;

  // Helper methods for common patterns
  protected async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Job timeout")), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  protected async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number,
    delay: number = 1000,
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, delay * Math.pow(2, i)),
          );
        }
      }
    }

    throw lastError!;
  }
}
