import { error, fail } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { z } from "zod";

import { tActions } from "@totallator/business-logic";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { serverPageInfo } from "$lib/routes.server";
import { getCronService } from "$lib/server/cron/newCronService";

import type { Actions, PageServerLoad } from "./$types";

const triggerJobSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
});

const updateConfigSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  schedule: z.string().min(1, "Schedule is required"),
  timeoutMs: z.number().min(1000, "Timeout must be at least 1000ms"),
  maxRetries: z.number().min(0, "Max retries must be non-negative"),
});

export const load: PageServerLoad = async (data) => {
  authGuard(data);
  const pageInfo = serverPageInfo(data.route.id, data);

  if (!pageInfo.current.params) {
    error(400, "Params Not Correctly Set");
  }

  // Get the specific cron job
  const cronJob = await tActions.cronJob.getCronJobById({
    id: pageInfo.current.params.id,
  });

  if (!cronJob) {
    error(404, "Cron job not found");
  }

  // Get execution history for this job (already included in cronJob)
  const executionHistory = cronJob.recentExecutions;

  return {
    cronJob,
    executionHistory: executionHistory,
    triggerJobForm: await superValidate({ jobId: "" }, zod4(triggerJobSchema)),
    updateConfigForm: await superValidate(
      {
        jobId: cronJob.id,
        schedule: cronJob.schedule,
        timeoutMs: cronJob.timeoutMs,
        maxRetries: cronJob.maxRetries,
      },
      zod4(updateConfigSchema),
    ),
  };
};

export const actions: Actions = {
  triggerJob: async ({ request, locals, params }) => {
    if (!locals.user?.admin) {
      return fail(403, { message: "Admin access required" });
    }

    const form = await superValidate(request, zod4(triggerJobSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const cronService = getCronService();
      if (!cronService) {
        return fail(500, { form, message: "Cron service not available" });
      }

      const result = await cronService.triggerJob(
        form.data.jobId,
        locals.user.id,
      );

      if (!result.success) {
        return fail(400, { form, message: result.message });
      }

      return {
        form,
        success: true,
        message: `Job triggered successfully. Execution ID: ${result.executionId}`,
      };
    } catch (error) {
      console.error("Error triggering job:", error);
      return fail(500, {
        form,
        message: `Failed to trigger job: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  },

  updateConfig: async ({ request, locals, params }) => {
    if (!locals.user?.admin) {
      return fail(403, { message: "Admin access required" });
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
        modifiedBy: locals.user.id,
      });

      // Note: In a real implementation, you'd need to restart the scheduler
      // or reload the specific job to apply the new configuration

      return {
        form,
        success: true,
        message:
          "Job configuration updated successfully. Changes will take effect on next service restart.",
      };
    } catch (error) {
      console.error("Error updating job config:", error);
      return fail(500, {
        form,
        message: `Failed to update job config: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  },
};
