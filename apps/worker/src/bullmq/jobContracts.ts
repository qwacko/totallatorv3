import type { DefaultJobMap, JobResult } from '@totallator/bullmq';

export const WORKER_QUEUES = {
	CRON: 'cron',
	BACKGROUND: 'background',
	LONG_RUNNING: 'long-running'
} as const;

export type CronControlJobData =
	| { action: 'trigger'; jobId: string; userId?: string }
	| { action: 'toggle'; jobId: string; isEnabled: boolean; modifiedBy: string }
	| { action: 'resync' };

export type WorkerJobMap = DefaultJobMap & {
	'test-log-job': {
		data: {
			message: string;
		};
		result: JobResult;
	};
	'cron-control': {
		data: CronControlJobData;
		result: JobResult;
	};
	'cron-execute': {
		data: {
			cronJobId: string;
			triggeredBy?: 'scheduler' | 'manual' | 'api';
			triggeredByUserId?: string;
			retryCount?: number;
		};
		result: JobResult;
	};
};
