// packages/bullmq/src/types.ts
import type { Job } from "bullmq";

export interface JobData {
  type: string;
  data: any;
  metadata?: {
    tenantId?: string;
    userId?: string;
    requestId?: string;
  };
}

export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
  metrics?: {
    executionTimeMs?: number;
    memoryUsageMb?: number;
  };
}

export interface JobProcessor<T = any> {
  (job: Job<any>, context: WorkerContext): Promise<JobResult>;
}

// Generic types that will be provided by consuming applications
export interface Logger {
  info: (data: any) => void;
  error: (data: any) => void;
  warn: (data: any) => void;
  debug: (data: any) => void;
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
