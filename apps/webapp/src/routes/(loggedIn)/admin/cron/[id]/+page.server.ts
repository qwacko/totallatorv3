import { error, fail } from '@sveltejs/kit';
import type { SingleServerRouteConfig } from 'skroutes';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

import { tActions } from '@totallator/business-logic';

import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes.server';
import { addJob } from '$lib/server/bullmq/bullmqService';

import type { Actions, PageServerLoad } from './$types';

export const _routeConfig = {
	paramsValidation: z.object({ id: z.string() })
} satisfies SingleServerRouteConfig;

const triggerJobSchema = z.object({
	jobId: z.string().min(1, 'Job ID is required')
});

const updateConfigSchema = z.object({
	jobId: z.string().min(1, 'Job ID is required'),
	schedule: z.string().min(1, 'Schedule is required'),
	timeoutMs: z.number().min(1000, 'Timeout must be at least 1000ms'),
	maxRetries: z.number().min(0, 'Max retries must be non-negative')
});

export const load: PageServerLoad = async (data) => {
	authGuard(data);
	const pageInfo = serverPageInfo(data.route.id, data);

	if (!pageInfo.current.params) {
		error(400, 'Params Not Correctly Set');
	}
	// Get the specific cron job
	const cronJob = await tActions.cronJob.getCronJobById({
		id: pageInfo.current.params.id
	});

	if (!cronJob) {
		error(404, 'Cron job not found');
	}

	// Get execution history for this job (already included in cronJob)
	const executionHistory = cronJob.recentExecutions;

	return {
		cronJob,
		executionHistory: executionHistory,
		triggerJobForm: await superValidate({ jobId: '' }, zod4(triggerJobSchema)),
		updateConfigForm: await superValidate(
			{
				jobId: cronJob.id,
				schedule: cronJob.schedule,
				timeoutMs: cronJob.timeoutMs,
				maxRetries: cronJob.maxRetries
			},
			zod4(updateConfigSchema)
		)
	};
};

export const actions: Actions = {
	triggerJob: async ({ request, locals, params }) => {
		if (!locals.user?.admin) {
			return fail(403, { message: 'Admin access required' });
		}

		const form = await superValidate(request, zod4(triggerJobSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await addJob('background', 'cron-control', {
				action: 'trigger',
				jobId: form.data.jobId,
				userId: locals.user.id
			});

			return {
				form,
				success: true,
				message: 'Job trigger request queued successfully'
			};
		} catch (error) {
			console.error('Error triggering job:', error);
			return fail(500, {
				form,
				message: `Failed to trigger job: ${error instanceof Error ? error.message : 'Unknown error'}`
			});
		}
	},

	updateConfig: async ({ request, locals, params }) => {
		if (!locals.user?.admin) {
			return fail(403, { message: 'Admin access required' });
		}

		const form = await superValidate(request, zod4(updateConfigSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await tActions.cronJob.updateCronJobConfig({
				id: form.data.jobId,
				schedule: form.data.schedule,
				timeoutMs: form.data.timeoutMs,
				maxRetries: form.data.maxRetries,
				modifiedBy: locals.user.id
			});

			await addJob('background', 'cron-control', { action: 'resync' });

			return {
				form,
				success: true,
				message: 'Job configuration updated and scheduler resync queued successfully.'
			};
		} catch (error) {
			console.error('Error updating job config:', error);
			return fail(500, {
				form,
				message: `Failed to update job config: ${error instanceof Error ? error.message : 'Unknown error'}`
			});
		}
	}
};
