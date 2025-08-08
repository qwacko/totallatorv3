import { redirect } from "@sveltejs/kit";

import { tActions } from "@totallator/business-logic";
import { updateReportLayoutSchema } from "@totallator/shared";
import { journalFilterSchemaWithoutPagination } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { failWrapper } from "$lib/helpers/customEnhance";
import { serverPageInfo } from "$lib/routes.server";

export const load = async (data) => {
  authGuard(data);
  const pageInfo = serverPageInfo(data.route.id, data);

  if (!pageInfo.current.params?.id) redirect(302, "/journalEntries");

  const dateSpan = pageInfo.current.searchParams?.dateSpan;
  const pageFilter = dateSpan ? { dateSpan } : undefined;

  const report = await tActions.report.getReportConfig({
    id: pageInfo.current.params?.id,
    pageFilter,
  });
  if (!report) redirect(302, "/journalEntries");

  return {
    report,
    dateSpan,
  };
};

export const actions = {
  updateLayout: async ({ request, locals }) => {
    const form = await request.formData();
    const id = form.get("id");
    const reportElements = form.get("reportElements");

    if (!id || !reportElements) return;

    const data = updateReportLayoutSchema.safeParse({
      id: id.toString(),
      reportElements: JSON.parse(reportElements.toString()),
    });

    if (!data.success) return;

    try {
      await tActions.report.updateLayout({
        layoutConfig: data.data,
      });
    } catch (e) {
      locals.global.logger.error("Error updating report layout", e);
      return;
    }

    return;
  },
  updateFilter: async ({ request, locals, params }) => {
    const form = await request.formData();
    const id = params.id;
    const filter = form.get("filter");

    if (!id || !filter) return;

    const data = journalFilterSchemaWithoutPagination.safeParse(
      JSON.parse(filter.toString()),
    );

    if (!data.success) {
      locals.global.logger.error(
        "Update Filter Parsing Error : ",
        data.error.message,
      );
      return failWrapper("Invalid Filter");
    }

    try {
      await tActions.report.upsertFilter({
        id,
        filter: data.data,
      });
    } catch (e) {
      locals.global.logger.error("Error updating report filter", e);
      return failWrapper("Error updating report filter");
    }

    return;
  },
};
