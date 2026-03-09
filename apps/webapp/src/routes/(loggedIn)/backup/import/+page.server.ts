import { redirect } from '@sveltejs/kit';
import { nanoid } from 'nanoid';

import { urlGenerator } from '$lib/routes.js';
import { addTypedJob } from '$lib/server/bullmq/bullmqService';
import { stageUploadedFile } from '$lib/server/bullmq/fileStaging';
import { WEBAPP_QUEUES } from '$lib/server/bullmq/jobContracts';
import type { WorkerJobMap } from '$lib/server/bullmq/jobContracts';

export const actions = {
	import: async ({ request, locals }) => {
		const formData = await request.formData();
		const backupFile = formData.get('backupFile') as File;

		const id = nanoid();

		try {
			const staged = await stageUploadedFile(backupFile, `backup-import-${id}`);
			await addTypedJob<WorkerJobMap, 'backup-import'>(
				WEBAPP_QUEUES.LONG_RUNNING,
				'backup-import',
				{
					backupId: id,
					file: staged
				}
			);
		} catch (e) {
			locals.global.logger('backup').error({
				code: 'BCK_0006',
				title: 'Backup Import Failed. Incorrect Contents',
				filename: backupFile.name
			});
			locals.global
				.logger('backup')
				.error({ code: 'BCK_0007', title: 'Backup Import Error', error: e });
			return;
		}

		redirect(302, urlGenerator({ address: '/(loggedIn)/backup/[id]', paramsValue: { id } }).url);
	}
};
