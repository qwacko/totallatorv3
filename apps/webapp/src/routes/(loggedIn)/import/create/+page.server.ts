import { fail, redirect } from '@sveltejs/kit';
import { message, setError, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import * as z from 'zod';

import { tActions } from '@totallator/business-logic';
import { createImportSchema } from '@totallator/shared';

import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { urlGenerator } from '$lib/routes.js';
import { addTypedJob } from '$lib/server/bullmq/bullmqService';
import { stageUploadedFile } from '$lib/server/bullmq/fileStaging';
import { WEBAPP_QUEUES } from '$lib/server/bullmq/jobContracts';
import type { WorkerJobMap } from '$lib/server/bullmq/jobContracts';

export const load = async (data) => {
	authGuard(data);

	data.locals.global.logger('imports').trace({
		code: 'WEB_IMP_010',
		title: 'Import creation page loaded',
		userId: data.locals.user?.id
	});

	const form = await superValidate(zod4(createImportSchema));

	return { form };
};

export const actions = {
	create: async ({ request, locals }) => {
		const startTime = Date.now();
		const form = await superValidate(request, zod4(createImportSchema));

		if (!form.valid) {
			locals.global.logger('imports').warn({
				code: 'WEB_IMP_011',
				title: 'Import creation form validation failed',
				userId: locals.user?.id,
				validationErrors: form.errors
			});
			return fail(400, { form });
		}

		locals.global.logger('imports').info({
			code: 'WEB_IMP_012',
			title: 'Import creation initiated via web',
			userId: locals.user?.id,
			importType: form.data.importType,
			importMappingId: form.data.importMappingId,
			autoProcess: form.data.autoProcess
		});

		try {
			if (form.data.importMappingId) {
				const result = await tActions.importMapping.getById({
					id: form.data.importMappingId
				});
				if (!result) {
					locals.global.logger('imports').warn({
						code: 'WEB_IMP_013',
						title: 'Import mapping not found during import creation',
						userId: locals.user?.id,
						importMappingId: form.data.importMappingId
					});
					return setError(
						form,
						'importMappingId',
						`Mapping ${form.data.importMappingId} Not Found`
					);
				}
			}

			const staged = await stageUploadedFile(form.data.file, 'import-store');

			await addTypedJob<WorkerJobMap, 'import-store'>(WEBAPP_QUEUES.LONG_RUNNING, 'import-store', {
				importType: form.data.importType,
				importMappingId: form.data.importMappingId,
				autoProcess: form.data.autoProcess,
				autoClean: form.data.autoClean,
				checkImportedOnly: form.data.checkImportedOnly,
				file: staged
			});

			const duration = Date.now() - startTime;
			locals.global.logger('imports').info({
				code: 'WEB_IMP_014',
				title: 'Import queued successfully via web',
				userId: locals.user?.id,
				importType: form.data.importType,
				autoProcess: form.data.autoProcess,
				duration
			});
		} catch (e) {
			const duration = Date.now() - startTime;
			locals.global.logger('imports').error({
				code: 'WEB_IMP_015',
				title: 'Import creation failed via web',
				userId: locals.user?.id,
				importType: form.data.importType,
				duration,
				error: e
			});
			const parsedError = z.object({ message: z.string() }).safeParse(e);
			if (parsedError.success) {
				return message(form, parsedError.data.message, { status: 400 });
			}
			return message(form, 'Unknown Error Loading File', { status: 400 });
		}

		redirect(302, urlGenerator({ address: '/(loggedIn)/import', searchParamsValue: {} }).url);
	}
};
