import { redirect } from "@sveltejs/kit";
import type { SingleServerRouteConfig } from "skroutes";
import * as z from "zod";

import { tActions } from "@totallator/business-logic";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { serverPageInfo } from "$lib/routes.server";

export const load = async (data) => {
  authGuard(data);
  const { current: pageInfo, updateParams } = serverPageInfo(
    data.route.id,
    data,
  );

  const filter = pageInfo.searchParams || {
    page: 0,
    pageSize: 20,
  };

  // Get LLM logs with pagination
  const logsResult = await tActions.llmLog.list({
    filter,
  });

  // Redirect if page is out of range
  const redirectRequired =
    logsResult.pagination.page >= logsResult.pagination.pageCount;
  if (redirectRequired && logsResult.pagination.pageCount > 0) {
    const targetPage = Math.max(0, logsResult.pagination.pageCount - 1);
    redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
  }

  // Get LLM settings for filter dropdown
  const llmSettings = await tActions.llm.list();

  return {
    logs: logsResult.data,
    pagination: logsResult.pagination,
    searchParams: pageInfo.searchParams,
    llmSettings,
  };
};

export const _routeConfig = {
  searchParamsValidation: z
    .object({
      page: z.coerce.number<number>().optional().default(0),
      pageSize: z.coerce.number<number>().optional().default(20),
      status: z.enum(["SUCCESS", "ERROR"]).optional(),
      llmSettingsId: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      relatedJournalId: z.string().optional(),
      orderBy: z.string().optional(),
    })
    .optional()
    .catch({ page: 0, pageSize: 20 }),
} satisfies SingleServerRouteConfig;
