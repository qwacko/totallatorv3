import { tActions } from "@totallator/business-logic";

import { authGuard } from "$lib/authGuard/authGuardConfig.js";
import { serverPageInfo } from "$lib/routes.js";

export const load = async (data) => {
  authGuard(data);
  const page = serverPageInfo(data.route.id, data);

  const searchParams = page.current.searchParams || {};

  // Use the filter directly since it's already in the correct format
  const filter = searchParams;

  // Get executions with filtering
  const executionsResult =
    await tActions.cronExecution.getCronJobExecutions(filter);

  // Get all cron jobs for filter dropdown
  const cronJobsResult = await tActions.cronJob.getAllCronJobs();

  // Get statistics for the filtered data
  const statistics = await tActions.cronExecution.getCronJobStatistics({
    days: 30,
    filter: {
      cronJobId: searchParams.cronJobId,
      status: searchParams.status,
      triggeredBy: searchParams.triggeredBy,
    },
  });

  return {
    executions: {
      data: executionsResult.data,
      count: executionsResult.count,
      page: searchParams.page || 0,
      pageSize: searchParams.pageSize || 25,
      pageCount: executionsResult.pageCount,
    },
    cronJobs: cronJobsResult.data.map((job) => ({
      id: job.id,
      name: job.name,
    })),
    statistics,
    searchParams,
    filterText: buildFilterText(searchParams),
  };
};

function buildFilterText(searchParams: any): string[] {
  const filters: string[] = [];

  if (searchParams.cronJobId) {
    filters.push(`Job: ${searchParams.cronJobId}`);
  }

  if (searchParams.status) {
    filters.push(`Status: ${searchParams.status}`);
  }

  if (searchParams.triggeredBy) {
    filters.push(`Triggered By: ${searchParams.triggeredBy}`);
  }

  return filters;
}
