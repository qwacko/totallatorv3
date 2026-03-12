import { fail } from '@sveltejs/kit';
import type { SingleServerRouteConfig } from 'skroutes';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

import { tActions } from '@totallator/business-logic';
import { cronJobUrlFilterSchema } from '@totallator/shared';

import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes.server';
import { addTypedJob } from '$lib/server/bullmq/bullmqService';
import { WEBAPP_QUEUES } from '$lib/server/bullmq/jobContracts';
import type { WorkerJobMap } from '$lib/server/bullmq/jobContracts';

import type { Actions } from './$types';

export const _routeConfig = {
	searchParamsValidation: cronJobUrlFilterSchema.optional().catch({})
} satisfies SingleServerRouteConfig;

const triggerJobSchema = z.object({
	jobId: z.string().min(1, 'Job ID is required')
});

const toggleJobSchema = z.object({
	jobId: z.string().min(1, 'Job ID is required'),
	isEnabled: z.boolean()
});

export const load = async (data) => {
	authGuard(data);
	const page = serverPageInfo(data.route.id, data);

	const searchParams = page.current.searchParams || {};

	// Get all cron jobs with their execution history
	const cronJobsResult = await tActions.cronJob.getAllCronJobs(searchParams);

	// console.log('Cron jobs loaded:', cronJobsResult);

	// Get recent execution statistics
	const statistics = await tActions.cronExecution.getCronJobStatistics({
		days: 30
	});

	// Get recent executions across all jobs (for the original table, if needed)
	const recentExecutionsResult = await tActions.cronExecution.getCronJobExecutions({
		pageSize: 20
	});

	return {
		cronJobs: cronJobsResult,
		statistics,
		recentExecutions: recentExecutionsResult.data,
		searchParams,
		triggerJobForm: await superValidate({ jobId: '' }, zod4(triggerJobSchema)),
		toggleJobForm: await superValidate({ jobId: '', isEnabled: false }, zod4(toggleJobSchema))
	};
};

export const actions: Actions = {
	triggerJob: async ({ request, locals }) => {
		if (!locals.user?.admin) {
			return fail(403, { message: 'Admin access required' });
		}

		const form = await superValidate(request, zod4(triggerJobSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await addTypedJob<WorkerJobMap, 'cron-control'>(WEBAPP_QUEUES.BACKGROUND, 'cron-control', {
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

	toggleJob: async ({ request, locals }) => {
		if (!locals.user?.admin) {
			return fail(403, { message: 'Admin access required' });
		}

		const form = await superValidate(request, zod4(toggleJobSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await addTypedJob<WorkerJobMap, 'cron-control'>(WEBAPP_QUEUES.BACKGROUND, 'cron-control', {
				action: 'toggle',
				jobId: form.data.jobId,
				isEnabled: form.data.isEnabled,
				modifiedBy: locals.user.id
			});

			return {
				form,
				success: true,
				message: `Job ${form.data.isEnabled ? 'enable' : 'disable'} request queued successfully`
			};
		} catch (error) {
			console.error('Error toggling job:', error);
			return fail(500, {
				form,
				message: `Failed to toggle job: ${error instanceof Error ? error.message : 'Unknown error'}`
			});
		}
	}
};
