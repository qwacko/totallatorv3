import { tActions } from '@totallator/business-logic';
import type { PageServerLoad, Actions } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { fail, redirect, error } from '@sveltejs/kit';
import { getCronService } from '$lib/server/cron/newCronService';
import type { CoreDBType } from '@totallator/database';

const triggerJobSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
});

const updateConfigSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  schedule: z.string().min(1, 'Schedule is required'),
  timeoutMs: z.number().min(1000, 'Timeout must be at least 1000ms'),
  maxRetries: z.number().min(0, 'Max retries must be non-negative'),
});

export const load: PageServerLoad = async ({ locals, params }) => {
  if (!locals.user) {
    redirect(302, '/login');
  }

  // Only allow admin users to access cron management
  if (!locals.user.admin) {
    redirect(302, '/');
  }

  try {
    // Cast locals.db to CoreDBType since we know it's the actual database connection
    const db = locals.db as CoreDBType;
    
    // Get the specific cron job
    const cronJob = await tActions.cronJob.getCronJobById({ id: params.id });
    
    if (!cronJob) {
      error(404, 'Cron job not found');
    }

    // Get execution history for this job (already included in cronJob)
    const executionHistory = cronJob.recentExecutions;

    return {
      cronJob,
      executionHistory: executionHistory,
      triggerJobForm: await superValidate({ jobId: '' }, zod4(triggerJobSchema)),
      updateConfigForm: await superValidate({
        jobId: cronJob.id,
        schedule: cronJob.schedule,
        timeoutMs: cronJob.timeoutMs,
        maxRetries: cronJob.maxRetries,
      }, zod4(updateConfigSchema)),
    };
  } catch (err) {
    console.error('Error loading cron job details:', err);
    error(500, 'Failed to load cron job details');
  }
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
      const cronService = getCronService();
      if (!cronService) {
        return fail(500, { form, message: 'Cron service not available' });
      }

      const result = await cronService.triggerJob(form.data.jobId, locals.user.id);
      
      if (!result.success) {
        return fail(400, { form, message: result.message });
      }

      return {
        form,
        success: true,
        message: `Job triggered successfully. Execution ID: ${result.executionId}`,
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
      // Cast locals.db to CoreDBType since we know it's the actual database connection
      const db = locals.db as CoreDBType;
      
      await tActions.cron.updateCronJobConfig({
        db,
        id: form.data.jobId,
        schedule: form.data.schedule,
        timeoutMs: form.data.timeoutMs,
        maxRetries: form.data.maxRetries,
        modifiedBy: locals.user.id,
      });

      // Note: In a real implementation, you'd need to restart the scheduler
      // or reload the specific job to apply the new configuration

      return {
        form,
        success: true,
        message: 'Job configuration updated successfully. Changes will take effect on next service restart.',
      };
    } catch (error) {
      console.error('Error updating job config:', error);
      return fail(500, { 
        form, 
        message: `Failed to update job config: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  },
};