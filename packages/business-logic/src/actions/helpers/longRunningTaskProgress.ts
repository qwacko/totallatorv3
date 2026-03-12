export type LongRunningTaskProgressUpdate = {
	progress?: number;
	message?: string;
	entityId?: string;
	metadata?: Record<string, unknown>;
};

export type LongRunningTaskProgressReporter = (
	update: LongRunningTaskProgressUpdate
) => Promise<void>;

export const reportLongRunningTaskProgress = async (
	reportProgress: LongRunningTaskProgressReporter | undefined,
	update: LongRunningTaskProgressUpdate
) => {
	if (!reportProgress) {
		return;
	}

	await reportProgress(update);
};
