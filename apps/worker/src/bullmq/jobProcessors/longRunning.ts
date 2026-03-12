import { workerRegistry } from '@totallator/bullmq';
import type { TypedJobProcessor } from '@totallator/bullmq';
import { tActions } from '@totallator/business-logic';

import { standaloneContext } from '../../context/workerContext';
import { runTrackedLongProcess } from '../../longProcess/state';
import { cleanupStagedFile, readStagedFile } from '../fileStaging';
import type { WorkerJobMap } from '../jobContracts';

export const backupRestoreProcessor: TypedJobProcessor<WorkerJobMap, 'backup-restore'> = async (
	job,
	context
) => {
	const payload = job.data.data;

	await runTrackedLongProcess({
		type: 'backup-restore',
		entityType: 'backup',
		entityId: payload.backupId,
		message: `Backup restore ${payload.backupId}`,
		metadata: { backupId: payload.backupId },
		maxRuntimeMs: 2 * 60 * 60 * 1000,
		run: async () =>
			standaloneContext(
				{
					requestId: `worker-backup-restore-${payload.backupId}`,
					routeId: 'worker/backup/restore',
					url: `/worker/backup/restore/${payload.backupId}`,
					method: 'WORKER',
					startTime: Date.now(),
					ip: '127.0.0.1'
				},
				async () => {
					await tActions.backup.restoreBackup({
						id: payload.backupId,
						includeUsers: payload.includeUsers ?? false,
						userId: payload.userId
					});
				}
			)
	});

	context.logger('worker').info({
		title: 'Backup restore completed from BullMQ worker',
		code: 'BULLMQ_WORKER_0004',
		backupId: payload.backupId
	});

	return { success: true, data: { backupId: payload.backupId } };
};

export const backupStoreProcessor: TypedJobProcessor<WorkerJobMap, 'backup-store'> = async (
	job
) => {
	await runTrackedLongProcess({
		type: 'backup-store',
		entityType: 'backup',
		message: 'Backup store',
		run: async () =>
			standaloneContext(
				{
					requestId: `worker-backup-store-${Date.now()}`,
					routeId: 'worker/backup/store',
					url: '/worker/backup/store',
					method: 'WORKER',
					startTime: Date.now(),
					ip: '127.0.0.1'
				},
				async () => {
					await tActions.backup.storeBackup(job.data.data);
				}
			)
	});
	return { success: true };
};

export const backupRefreshProcessor: TypedJobProcessor<
	WorkerJobMap,
	'backup-refresh'
> = async () => {
	await runTrackedLongProcess({
		type: 'backup-refresh',
		entityType: 'backup',
		message: 'Backup refresh',
		run: async () =>
			standaloneContext(
				{
					requestId: `worker-backup-refresh-${Date.now()}`,
					routeId: 'worker/backup/refresh',
					url: '/worker/backup/refresh',
					method: 'WORKER',
					startTime: Date.now(),
					ip: '127.0.0.1'
				},
				async () => {
					await tActions.backup.refreshList();
				}
			)
	});
	return { success: true };
};

export const backupTrimProcessor: TypedJobProcessor<WorkerJobMap, 'backup-trim'> = async () => {
	await runTrackedLongProcess({
		type: 'backup-trim',
		entityType: 'backup',
		message: 'Backup trim',
		run: async () =>
			standaloneContext(
				{
					requestId: `worker-backup-trim-${Date.now()}`,
					routeId: 'worker/backup/trim',
					url: '/worker/backup/trim',
					method: 'WORKER',
					startTime: Date.now(),
					ip: '127.0.0.1'
				},
				async () => {
					await tActions.backup.trimBackups();
				}
			)
	});
	return { success: true };
};

export const backupDeleteProcessor: TypedJobProcessor<WorkerJobMap, 'backup-delete'> = async (
	job
) => {
	await runTrackedLongProcess({
		type: 'backup-delete',
		entityType: 'backup',
		entityId: job.data.data.backupId,
		message: `Backup delete ${job.data.data.backupId}`,
		metadata: { backupId: job.data.data.backupId },
		run: async () =>
			standaloneContext(
				{
					requestId: `worker-backup-delete-${job.data.data.backupId}`,
					routeId: 'worker/backup/delete',
					url: `/worker/backup/delete/${job.data.data.backupId}`,
					method: 'WORKER',
					startTime: Date.now(),
					ip: '127.0.0.1'
				},
				async () => {
					await tActions.backup.deleteBackup({ id: job.data.data.backupId });
				}
			)
	});
	return { success: true };
};

export const backupImportProcessor: TypedJobProcessor<WorkerJobMap, 'backup-import'> = async (
	job
) => {
	const payload = job.data.data;

	await runTrackedLongProcess({
		type: 'backup-import',
		entityType: 'backup',
		entityId: payload.backupId,
		message: `Backup import ${payload.backupId}`,
		metadata: { backupId: payload.backupId },
		maxRuntimeMs: 2 * 60 * 60 * 1000,
		run: async () =>
			standaloneContext(
				{
					requestId: `worker-backup-import-${payload.backupId}`,
					routeId: 'worker/backup/import',
					url: `/worker/backup/import/${payload.backupId}`,
					method: 'WORKER',
					startTime: Date.now(),
					ip: '127.0.0.1'
				},
				async () => {
					const stagedFile = await readStagedFile(payload.file);
					try {
						await tActions.backup.importFile({ backupFile: stagedFile, id: payload.backupId });
					} finally {
						await cleanupStagedFile(payload.file);
					}
				}
			)
	});

	return { success: true, data: { backupId: payload.backupId } };
};

export const autoImportTriggerProcessor: TypedJobProcessor<
	WorkerJobMap,
	'auto-import-trigger'
> = async (job, context) => {
	const payload = job.data.data;

	await runTrackedLongProcess({
		type: 'auto-import-trigger',
		entityType: 'autoImport',
		entityId: payload.autoImportId,
		message: `Auto import ${payload.autoImportId}`,
		metadata: { autoImportId: payload.autoImportId },
		run: async () =>
			standaloneContext(
				{
					requestId: `worker-auto-import-${payload.autoImportId}`,
					routeId: 'worker/auto-import/trigger',
					url: `/worker/auto-import/trigger/${payload.autoImportId}`,
					method: 'WORKER',
					startTime: Date.now(),
					ip: '127.0.0.1'
				},
				async () => {
					await tActions.autoImport.trigger({ id: payload.autoImportId });
				}
			)
	});

	context.logger('worker').info({
		title: 'Auto-import trigger completed from BullMQ worker',
		code: 'BULLMQ_WORKER_0005',
		autoImportId: payload.autoImportId,
		triggeredByUserId: payload.triggeredByUserId
	});

	return { success: true, data: { autoImportId: payload.autoImportId } };
};

export const importStoreProcessor: TypedJobProcessor<WorkerJobMap, 'import-store'> = async (
	job
) => {
	const payload = job.data.data;

	await runTrackedLongProcess({
		type: 'import-store',
		entityType: 'import',
		message: 'Import store',
		metadata: { importType: payload.importType, autoProcess: payload.autoProcess },
		maxRuntimeMs: 3 * 60 * 60 * 1000,
		run: async ({ reportProgress }) =>
			standaloneContext(
				{
					requestId: `worker-import-store-${Date.now()}`,
					routeId: 'worker/import/store',
					url: '/worker/import/store',
					method: 'WORKER',
					startTime: Date.now(),
					ip: '127.0.0.1'
				},
				async () => {
					await reportProgress({ progress: 5, message: 'Preparing import file' });
					const stagedFile = await readStagedFile(payload.file);
					try {
						await reportProgress({ progress: 20, message: 'Processing import file' });
						await tActions.import.store({
							autoImportId: payload.autoImportId,
							data: {
								importType: payload.importType,
								importMappingId: payload.importMappingId,
								autoProcess: payload.autoProcess,
								autoClean: payload.autoClean,
								checkImportedOnly: payload.checkImportedOnly,
								file: stagedFile
							}
						});
						await reportProgress({ progress: 90, message: 'Running post-import checks' });
					} finally {
						await cleanupStagedFile(payload.file);
					}
				}
			)
	});
	return { success: true };
};

export const importReprocessProcessor: TypedJobProcessor<WorkerJobMap, 'import-reprocess'> = async (
	job
) => {
	await runTrackedLongProcess({
		type: 'import-reprocess',
		entityType: 'import',
		entityId: job.data.data.importId,
		message: `Import reprocess ${job.data.data.importId}`,
		metadata: { importId: job.data.data.importId },
		maxRuntimeMs: 2 * 60 * 60 * 1000,
		run: async ({ reportProgress }) =>
			standaloneContext(
				{
					requestId: `worker-import-reprocess-${job.data.data.importId}`,
					routeId: 'worker/import/reprocess',
					url: `/worker/import/reprocess/${job.data.data.importId}`,
					method: 'WORKER',
					startTime: Date.now(),
					ip: '127.0.0.1'
				},
				async () => {
					await reportProgress({ progress: 20, message: 'Reprocessing import data' });
					await tActions.import.reprocess({ id: job.data.data.importId });
					await reportProgress({ progress: 90, message: 'Finalizing reprocess updates' });
				}
			)
	});
	return { success: true };
};

export const importCleanProcessor: TypedJobProcessor<WorkerJobMap, 'import-clean'> = async (
	job
) => {
	await runTrackedLongProcess({
		type: 'import-clean',
		entityType: 'import',
		entityId: job.data.data.importId,
		message: `Import clean ${job.data.data.importId}`,
		metadata: { importId: job.data.data.importId },
		maxRuntimeMs: 2 * 60 * 60 * 1000,
		run: async ({ reportProgress }) =>
			standaloneContext(
				{
					requestId: `worker-import-clean-${job.data.data.importId}`,
					routeId: 'worker/import/clean',
					url: `/worker/import/clean/${job.data.data.importId}`,
					method: 'WORKER',
					startTime: Date.now(),
					ip: '127.0.0.1'
				},
				async () => {
					await reportProgress({ progress: 25, message: 'Cleaning import records' });
					await tActions.import.clean({ id: job.data.data.importId });
					await reportProgress({ progress: 90, message: 'Applying cleanup updates' });
				}
			)
	});
	return { success: true };
};

export const importTriggerProcessor: TypedJobProcessor<WorkerJobMap, 'import-trigger'> = async (
	job
) => {
	await runTrackedLongProcess({
		type: 'import-trigger',
		entityType: 'import',
		entityId: job.data.data.importId,
		message: `Import trigger ${job.data.data.importId}`,
		metadata: { importId: job.data.data.importId },
		maxRuntimeMs: 2 * 60 * 60 * 1000,
		run: async ({ reportProgress }) =>
			standaloneContext(
				{
					requestId: `worker-import-trigger-${job.data.data.importId}`,
					routeId: 'worker/import/trigger',
					url: `/worker/import/trigger/${job.data.data.importId}`,
					method: 'WORKER',
					startTime: Date.now(),
					ip: '127.0.0.1'
				},
				async () => {
					await reportProgress({ progress: 20, message: 'Starting import processing' });
					await tActions.import.triggerImport({ id: job.data.data.importId });
					await reportProgress({ progress: 90, message: 'Running import validation and updates' });
				}
			)
	});
	return { success: true };
};

export const importDeleteProcessor: TypedJobProcessor<WorkerJobMap, 'import-delete'> = async (
	job
) => {
	await runTrackedLongProcess({
		type: 'import-delete',
		entityType: 'import',
		entityId: job.data.data.importId,
		message: `Import delete ${job.data.data.importId}`,
		metadata: { importId: job.data.data.importId },
		run: async () =>
			standaloneContext(
				{
					requestId: `worker-import-delete-${job.data.data.importId}`,
					routeId: 'worker/import/delete',
					url: `/worker/import/delete/${job.data.data.importId}`,
					method: 'WORKER',
					startTime: Date.now(),
					ip: '127.0.0.1'
				},
				async () => {
					await tActions.import.delete({ id: job.data.data.importId });
				}
			)
	});
	return { success: true };
};

export const importDeleteLinkedProcessor: TypedJobProcessor<
	WorkerJobMap,
	'import-delete-linked'
> = async (job) => {
	await runTrackedLongProcess({
		type: 'import-delete-linked',
		entityType: 'import',
		entityId: job.data.data.importId,
		message: `Import delete linked ${job.data.data.importId}`,
		metadata: { importId: job.data.data.importId },
		run: async () =>
			standaloneContext(
				{
					requestId: `worker-import-delete-linked-${job.data.data.importId}`,
					routeId: 'worker/import/delete-linked',
					url: `/worker/import/delete-linked/${job.data.data.importId}`,
					method: 'WORKER',
					startTime: Date.now(),
					ip: '127.0.0.1'
				},
				async () => {
					await tActions.import.deleteLinked({ id: job.data.data.importId });
				}
			)
	});
	return { success: true };
};

export const importForgetProcessor: TypedJobProcessor<WorkerJobMap, 'import-forget'> = async (
	job
) => {
	await runTrackedLongProcess({
		type: 'import-forget',
		entityType: 'import',
		entityId: job.data.data.importId,
		message: `Import forget ${job.data.data.importId}`,
		metadata: { importId: job.data.data.importId },
		run: async () =>
			standaloneContext(
				{
					requestId: `worker-import-forget-${job.data.data.importId}`,
					routeId: 'worker/import/forget',
					url: `/worker/import/forget/${job.data.data.importId}`,
					method: 'WORKER',
					startTime: Date.now(),
					ip: '127.0.0.1'
				},
				async () => {
					await tActions.import.forgetImport({ id: job.data.data.importId });
				}
			)
	});
	return { success: true };
};

export const fileCheckExistsProcessor: TypedJobProcessor<
	WorkerJobMap,
	'file-check-exists'
> = async () => {
	await runTrackedLongProcess({
		type: 'file-check-exists',
		message: 'File check exists',
		run: async () =>
			standaloneContext(
				{
					requestId: `worker-file-check-exists-${Date.now()}`,
					routeId: 'worker/file/check-exists',
					url: '/worker/file/check-exists',
					method: 'WORKER',
					startTime: Date.now(),
					ip: '127.0.0.1'
				},
				async () => {
					await tActions.file.checkFilesExist();
				}
			)
	});
	return { success: true };
};

workerRegistry.registerTyped<WorkerJobMap, 'backup-restore'>(
	'backup-restore',
	backupRestoreProcessor,
	{
		attempts: 1
	}
);
workerRegistry.registerTyped<WorkerJobMap, 'backup-store'>('backup-store', backupStoreProcessor, {
	attempts: 1
});
workerRegistry.registerTyped<WorkerJobMap, 'backup-refresh'>(
	'backup-refresh',
	backupRefreshProcessor,
	{ attempts: 1 }
);
workerRegistry.registerTyped<WorkerJobMap, 'backup-trim'>('backup-trim', backupTrimProcessor, {
	attempts: 1
});
workerRegistry.registerTyped<WorkerJobMap, 'backup-delete'>(
	'backup-delete',
	backupDeleteProcessor,
	{
		attempts: 1
	}
);
workerRegistry.registerTyped<WorkerJobMap, 'backup-import'>(
	'backup-import',
	backupImportProcessor,
	{
		attempts: 1
	}
);
workerRegistry.registerTyped<WorkerJobMap, 'auto-import-trigger'>(
	'auto-import-trigger',
	autoImportTriggerProcessor,
	{ attempts: 3 }
);
workerRegistry.registerTyped<WorkerJobMap, 'import-store'>('import-store', importStoreProcessor, {
	attempts: 1
});
workerRegistry.registerTyped<WorkerJobMap, 'import-reprocess'>(
	'import-reprocess',
	importReprocessProcessor,
	{ attempts: 2 }
);
workerRegistry.registerTyped<WorkerJobMap, 'import-clean'>('import-clean', importCleanProcessor, {
	attempts: 2
});
workerRegistry.registerTyped<WorkerJobMap, 'import-trigger'>(
	'import-trigger',
	importTriggerProcessor,
	{
		attempts: 2
	}
);
workerRegistry.registerTyped<WorkerJobMap, 'import-delete'>(
	'import-delete',
	importDeleteProcessor,
	{
		attempts: 1
	}
);
workerRegistry.registerTyped<WorkerJobMap, 'import-delete-linked'>(
	'import-delete-linked',
	importDeleteLinkedProcessor,
	{ attempts: 1 }
);
workerRegistry.registerTyped<WorkerJobMap, 'import-forget'>(
	'import-forget',
	importForgetProcessor,
	{
		attempts: 1
	}
);
workerRegistry.registerTyped<WorkerJobMap, 'file-check-exists'>(
	'file-check-exists',
	fileCheckExistsProcessor,
	{ attempts: 1 }
);
