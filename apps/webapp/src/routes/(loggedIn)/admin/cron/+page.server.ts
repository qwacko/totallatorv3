import { fail, redirect } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { z } from "zod";

import { tActions } from "@totallator/business-logic";

import { getCronService } from "$lib/server/cron/newCronService";

import type { Actions, PageServerLoad } from "./$types";

const triggerJobSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
});

const toggleJobSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  isEnabled: z.boolean(),
});

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(302, "/login");
  }

  // Only allow admin users to access cron management
  if (!locals.user.admin) {
    redirect(302, "/");
  }

  try {
    // Cast locals.db to CoreDBType since we know it's the actual database connection
    const db = locals.db as CoreDBType;

    // Get all cron jobs with their execution history
    const cronJobsResult = await tActions.cronJob.getAllCronJobs();

    // Get recent execution statistics
    const statistics = await tActions.cronExecution.getCronJobStatistics({
      days: 30,
    });

    // Get recent executions across all jobs (for the original table, if needed)
    const recentExecutionsResult =
      await tActions.cronExecution.getCronJobExecutions({
        filter: {},
        limit: 20,
      });

    return {
      cronJobs: cronJobsResult.data,
      statistics,
      recentExecutions: recentExecutionsResult.data,
      triggerJobForm: await superValidate(
        { jobId: "" },
        zod4(triggerJobSchema),
      ),
      toggleJobForm: await superValidate(
        { jobId: "", isEnabled: false },
        zod4(toggleJobSchema),
      ),
    };
  } catch (error) {
    console.error("Error loading cron data:", error);
    return {
      cronJobs: [],
      statistics: {
        period: "Last 30 days",
        totalExecutions: 0,
        statusBreakdown: [],
        successRate: 0,
      },
      recentExecutions: [],
      triggerJobForm: await superValidate(
        { jobId: "" },
        zod4(triggerJobSchema),
      ),
      toggleJobForm: await superValidate(
        { jobId: "", isEnabled: false },
        zod4(toggleJobSchema),
      ),
    };
  }
};

export const actions: Actions = {
  triggerJob: async ({ request, locals }) => {
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

  toggleJob: async ({ request, locals }) => {
    if (!locals.user?.admin) {
      return fail(403, { message: "Admin access required" });
    }

    const form = await superValidate(request, zod4(toggleJobSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const cronService = getCronService();
      if (!cronService) {
        return fail(500, { form, message: "Cron service not available" });
      }

      await cronService.updateJobStatus(
        form.data.jobId,
        form.data.isEnabled,
        locals.user.id,
      );

      return {
        form,
        success: true,
        message: `Job ${form.data.isEnabled ? "enabled" : "disabled"} successfully`,
      };
    } catch (error) {
      console.error("Error toggling job:", error);
      return fail(500, {
        form,
        message: `Failed to toggle job: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  },
};
