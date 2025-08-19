import { fail } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";

import { tActions } from "@totallator/business-logic";
import { journalFilterSchemaWithoutPagination } from "@totallator/shared";
import {
  updateReportConfigurationSchema,
  updateReportElementSchema,
} from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig";

export const load = async (data) => {
  authGuard(data);
};

export const actions = {
  update: async (data) => {
    const id = data.params.id;
    const form = await superValidate(
      data.request,
      zod4(updateReportElementSchema),
    );

    if (!form.valid) {
      return form;
    }

    try {
      await tActions.report.reportElement.update({
        data: { ...form.data, id },
      });
    } catch (e) {
      data.locals.global.logger('reports').error({code: "RPT_0006", title: "Error Updating Report Element", error: e});
    }
  },
  addFilter: async (data) => {
    const id = data.params.id;

    try {
      await tActions.report.reportElement.addFilter({ id });
    } catch (e) {
      data.locals.global.logger('reports').error({
        code: "RPT_0007",
        title: "Error Adding Filter to Report Element",
        error: e
      });
    }

    return;
  },
  updateFilter: async (data) => {
    const id = data.params.id;

    const form = await data.request.formData();
    const filterText = form.get("filterText");

    try {
      if (!filterText) {
        throw new Error("Filter Text not found");
      }

      const transformedFilterText =
        journalFilterSchemaWithoutPagination.safeParse(
          JSON.parse(filterText.toString()),
        );

      if (!transformedFilterText.success) {
        throw new Error(
          `Filter Text not valid : ${transformedFilterText.error.message}`,
        );
      }

      await tActions.report.reportElement.updateFilter({
        id,
        filter: transformedFilterText.data,
      });
    } catch (e) {
      data.locals.global.logger('reports').error({
        code: "RPT_0008",
        title: "Error Updating Filter to Report Element",
        error: e
      });
    }

    return;
  },
  removeFilter: async (data) => {
    const id = data.params.id;

    try {
      await tActions.report.reportElement.removeFilter({ id });
    } catch (e) {
      data.locals.global.logger('reports').error({
        code: "RPT_0009",
        title: "Error Removing Filter to Report Element",
        error: e
      });
    }

    return;
  },
  updateConfig: async (data) => {
    const formData = await superValidate(
      data.request,
      zod4(updateReportConfigurationSchema),
    );

    if (!formData.valid) {
      return formData;
    }

    const id = data.params.id;

    try {
      await tActions.report.reportElementConfiguration.update({
        reportElementId: id,
        data: formData.data,
      });
    } catch (e) {
      data.locals.global.logger('reports').error({
        code: "RPT_0010",
        title: "Error Updating Report Element Config",
        error: e
      });
      return message(formData, "Error Updating Report Element Config", {
        status: 400,
      });
    }
    return formData;
  },
  addConfigFilter: async (data) => {
    const id = data.params.id;

    const reportElement = await tActions.report.reportElement.get({ id });

    if (!reportElement) {
      return fail(400, { message: "Report Element Not Found" });
    }

    try {
      await tActions.report.reportElementConfiguration.addFilter({
        configId: reportElement.reportElementConfigId,
      });
    } catch (e) {
      data.locals.global.logger('reports').error({
        code: "RPT_0011",
        title: "Error Adding Filter to Report Element",
        error: e
      });
      return fail(400, { message: "Error Adding Filter to Report Element" });
    }

    return;
  },
  updateConfigFilter: async (data) => {
    const id = data.params.id;

    const form = await data.request.formData();
    const filterText = form.get("filterText");
    const filterId = form.get("filterId");

    const reportElement = await tActions.report.reportElement.get({ id });

    if (!reportElement) {
      return fail(400, { message: "Report Element Not Found" });
    }

    try {
      if (!filterText) {
        throw new Error("Filter Text not found");
      }
      if (!filterId) {
        throw new Error("Filter Id not found");
      }

      const transformedFilterText =
        journalFilterSchemaWithoutPagination.safeParse(
          JSON.parse(filterText.toString()),
        );

      if (!transformedFilterText.success) {
        throw new Error(
          `Filter Text not valid : ${transformedFilterText.error.message}`,
        );
      }

      await tActions.report.reportElementConfiguration.updateFilter({
        configId: reportElement.reportElementConfigId,
        filterId: filterId.toString(),
        filter: transformedFilterText.data,
      });
    } catch (e) {
      data.locals.global.logger('reports').error({
        code: "RPT_0012",
        title: "Error Updating Filter on Report Configuration",
        error: e
      });
      return fail(400, { message: "Error Updating Filter to Report Element" });
    }

    return;
  },
  removeConfigFilter: async (data) => {
    const id = data.params.id;

    const reportElement = await tActions.report.reportElement.get({ id });

    if (!reportElement) {
      return fail(400, { message: "Report Element Not Found" });
    }

    const form = await data.request.formData();
    const filterId = form.get("filterId");

    if (!filterId) {
      return fail(400, { message: "Filter Id not found" });
    }

    try {
      await tActions.report.reportElementConfiguration.removeFilter({
        configId: reportElement.reportElementConfigId,
        filterId: filterId.toString(),
      });
    } catch (e) {
      data.locals.global.logger('reports').error({
        code: "RPT_0013",
        title: "Error Removing Filter to Report Element",
        error: e
      });
      return fail(400, { message: "Error Removing Filter to Report Element" });
    }

    return;
  },
};
