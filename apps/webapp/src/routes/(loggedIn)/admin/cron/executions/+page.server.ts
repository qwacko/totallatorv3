import { redirect } from "@sveltejs/kit";

import { tActions } from "@totallator/business-logic";
import { urlFilterToCronExecutionFilter } from "@totallator/shared";

export const load = async ({ locals, url }) => {
  if (!locals.user) {
    redirect(302, "/login");
  }

  // Only allow admin users to access cron management
  if (!locals.user.admin) {
    redirect(302, "/");
  }

  try {
    // Parse URL parameters using the shared filter converter
    const urlFilter = {
      textFilter: url.searchParams.get("textFilter") || undefined,
      jobId: url.searchParams.get("jobId") || undefined,
      status: (url.searchParams.get("status") as any) || undefined,
      triggeredBy: (url.searchParams.get("triggeredBy") as any) || undefined,
      page: parseInt(url.searchParams.get("page") || "1"),
      pageSize: parseInt(url.searchParams.get("pageSize") || "25"),
      orderBy: url.searchParams.get("orderBy") || "startedAt-desc",
    };

    const filter = urlFilterToCronExecutionFilter(urlFilter);

    // Get executions with filtering
    const executionsResult =
      await tActions.cronExecution.getCronJobExecutions(filter);

    // Get all cron jobs for filter dropdown
    const cronJobsResult = await tActions.cronJob.getAllCronJobs();

    // Get statistics for the filtered data
    const statistics = await tActions.cronExecution.getCronJobStatistics({
      days: 30,
      filter: {
        cronJobId: urlFilter.jobId,
        status: urlFilter.status,
        triggeredBy: urlFilter.triggeredBy,
      },
    });

    return {
      executions: {
        data: executionsResult.data,
        count: executionsResult.count,
        page: urlFilter.page,
        pageSize: urlFilter.pageSize,
        pageCount: executionsResult.pageCount,
      },
      cronJobs: cronJobsResult.data.map((job) => ({
        id: job.id,
        name: job.name,
      })),
      statistics,
      searchParams: urlFilter,
      filterText: buildFilterText(urlFilter),
    };
  } catch (error) {
    console.error("Error loading cron executions:", error);
    const defaultUrlFilter = {
      page: 1,
      pageSize: 25,
      orderBy: "startedAt-desc",
    };
    return {
      executions: {
        data: [],
        count: 0,
        page: 1,
        pageSize: 25,
        pageCount: 0,
      },
      cronJobs: [],
      statistics: {
        period: "Last 30 days",
        totalExecutions: 0,
        statusBreakdown: [],
        successRate: 0,
      },
      searchParams: defaultUrlFilter,
      filterText: [],
    };
  }
};

function buildFilterText(searchParams: any): string[] {
  const filters: string[] = [];

  if (searchParams.jobId) {
    filters.push(`Job: ${searchParams.jobId}`);
  }

  if (searchParams.status) {
    filters.push(`Status: ${searchParams.status}`);
  }

  if (searchParams.triggeredBy) {
    filters.push(`Triggered By: ${searchParams.triggeredBy}`);
  }

  return filters;
}
