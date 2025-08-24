import type { GlobalContext } from '@totallator/context';

/**
 * Represents a cron job definition with its execution logic
 */
export interface CronJobDefinition {
	/** Unique identifier for the cron job */
	id: string;
	/** Human-readable name for the cron job */
	name: string;
	/** Detailed description of what the cron job does */
	description: string;
	/** Cron expression defining when the job should run */
	schedule: string;
	/** Whether this job is enabled by default */
	isEnabled: boolean;
	/** Maximum execution time in milliseconds before timeout */
	timeoutMs: number;
	/** Maximum number of retry attempts on failure */
	maxRetries: number;
	/** The actual job function to execute */
	job: (context: GlobalContext) => Promise<CronJobResult>;
}

/**
 * Result of a cron job execution
 */
export interface CronJobResult {
	/** Whether the job succeeded */
	success: boolean;
	/** Human-readable message about the execution */
	message?: string;
	/** Any data returned by the job */
	data?: Record<string, unknown>;
	/** Performance metrics */
	metrics?: {
		itemsProcessed?: number;
		executionTimeMs?: number;
		memoryUsageMb?: number;
	};
}

/**
 * Context for a cron job execution
 */
export interface CronJobExecutionContext {
	/** The cron job definition being executed */
	jobDefinition: CronJobDefinition;
	/** Current retry count (0 for first attempt) */
	retryCount: number;
	/** Who triggered this execution */
	triggeredBy: 'scheduler' | 'manual' | 'api';
	/** User ID if manually triggered */
	triggeredByUserId?: string;
	/** Execution start time */
	startTime: Date;
}

/**
 * Status of a cron job execution
 */
export type CronJobExecutionStatus =
	| 'running'
	| 'completed'
	| 'failed'
	| 'timeout'
	| 'cancelled'
	| 'skipped';

/**
 * Filter options for querying cron job executions
 */
export interface CronJobExecutionFilter {
	cronJobId?: string;
	status?: CronJobExecutionStatus;
	triggeredBy?: 'scheduler' | 'manual' | 'api';
	startedAfter?: Date;
	startedBefore?: Date;
	limit?: number;
	offset?: number;
}
