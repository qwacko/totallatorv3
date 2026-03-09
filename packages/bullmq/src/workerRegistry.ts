import type {
  DefaultJobMap,
  JobProcessor,
  TypedJobProcessor,
} from "./types.js";

type RegisteredJobDefinition = {
  type: string;
  processor: JobProcessor;
  options?: {
    defaultRepeat?: string;
    defaultPriority?: number;
    attempts?: number;
  };
};

export class WorkerRegistry {
  private processors = new Map<string, JobProcessor>();
  private jobDefinitions: RegisteredJobDefinition[] = [];

  /**
   * Register a job processor with optional default configuration
   */
  register(
    type: string,
    processor: JobProcessor,
    options?: {
      defaultRepeat?: string;
      defaultPriority?: number;
      attempts?: number;
    },
  ) {
    this.processors.set(type, processor);
    this.jobDefinitions = this.jobDefinitions.filter(
      (jobDefinition) => jobDefinition.type !== type,
    );
    this.jobDefinitions.push({ type, processor, options });
  }

  registerTyped<
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
    this.register(type, processor as JobProcessor, options);
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

  getTypedProcessor<
    TJobMap extends DefaultJobMap,
    K extends keyof TJobMap & string,
  >(type: K): TypedJobProcessor<TJobMap, K> | undefined {
    return this.processors.get(type) as
      | TypedJobProcessor<TJobMap, K>
      | undefined;
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
