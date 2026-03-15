import type { Job } from "bullmq";

export interface DefaultJobMap {
  [jobType: string]: {
    data: unknown;
    result: JobResult;
    metadata?: JobMetadata;
  };
}

export type JobMetadata = {
  tenantId?: string;
  userId?: string;
  requestId?: string;
  traceContext?: Record<string, string>;
  [key: string]: unknown;
};

export type JobData<TData = unknown, TType extends string = string> = {
  type: TType;
  data: TData;
  metadata?: JobMetadata;
};

export interface JobResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metrics?: {
    executionTimeMs?: number;
    memoryUsageMb?: number;
  };
}

export interface JobProcessor<TData = unknown, TResult = JobResult> {
  (job: Job<JobData<TData>>, context: WorkerContext): Promise<TResult>;
}

export type TypedJobProcessor<
  TJobMap extends DefaultJobMap,
  K extends keyof TJobMap & string,
> = JobProcessor<TJobMap[K]["data"], TJobMap[K]["result"]>;

// Generic types that will be provided by consuming applications
export interface Logger {
  info: (data: unknown) => void;
  error: (data: unknown) => void;
  warn: (data: unknown) => void;
  debug: (data: unknown) => void;
}

export type LoggerFactory = (category: string) => Logger;

export interface CoreDBType {
  // Database connection type - will be provided by consuming app
}

export interface ServerEnvSchemaType {
  // Server environment type - will be provided by consuming app
}

export interface GlobalContext {
  // Global context type - will be provided by consuming app
}

export interface WorkerContext {
  logger: (category: string) => Logger;
  db: CoreDBType;
  serverEnv: ServerEnvSchemaType;
  getGlobalContext?: () => Promise<GlobalContext>;
}
