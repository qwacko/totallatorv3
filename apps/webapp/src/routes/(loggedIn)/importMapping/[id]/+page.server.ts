import { redirect } from "@sveltejs/kit";
import { setError, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

import { tActions } from "@totallator/business-logic";
import {
  importMappingDetailSchema,
  importMappingDetailWithRefinementSchema,
  importMappingUpdateFormSchema,
} from "@totallator/shared";
import type { ImportFilterSchemaType } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { serverPageInfo, urlGenerator } from "$lib/routes";
import { bufferingHelper } from "$lib/server/bufferingHelper.js";

export const load = async (data) => {
  authGuard(data);
  const db = data.locals.db;
  const { current } = serverPageInfo(data.route.id, data);
  bufferingHelper(data);

  if (!current.params) {
    redirect(
      302,
      urlGenerator({
        address: "/(loggedIn)/importMapping",
        searchParamsValue: {},
      }).url,
    );
  }

  const importMapping = await tActions.importMapping.getById({
    db,
    id: current.params.id,
  });

  if (!importMapping) {
    redirect(
      302,
      urlGenerator({
        address: "/(loggedIn)/importMapping",
        searchParamsValue: {},
      }).url,
    );
  }

  const form = await superValidate(
    {
      title: importMapping.title,
      configuration: JSON.stringify(importMapping.configuration),
    },
    zod4(importMappingUpdateFormSchema),
  );

  const autoImports = await tActions.autoImport.list({
    db,
    filter: { importMappingId: importMapping.id, pageSize: 100 },
  });

  const detailForm = await superValidate(
    importMapping.configuration,
    zod4(importMappingDetailSchema),
  );

  const importFilter: ImportFilterSchemaType = {
    mapping: importMapping.id,
    page: 0,
    pageSize: 5,
    orderBy: [{ direction: "desc", field: "createdAt" }],
  };

  const imports = tActions.import.listDetails({
    db,
    filter: importFilter,
  });

  return {
    importMapping,
    form,
    detailForm,
    autoImports,
    importFilter,
    imports,
  };
};

const importMappingUpdateFormSchemaWithPrevPage = z.object({
  ...importMappingUpdateFormSchema.shape,
  prevPage: z.string().optional(),
});

export const actions = {
  default: async (data) => {
    const id = data.params.id;
    const form = await superValidate(
      data.request,
      zod4(importMappingUpdateFormSchemaWithPrevPage),
    );

    if (!form.valid) {
      return form;
    }

    const { configuration, prevPage, ...restData } = form.data;

    const configurationProcessed =
      importMappingDetailWithRefinementSchema.safeParse(
        JSON.parse(configuration),
      );

    if (!configurationProcessed.success) {
      return setError(form, "configuration", "Configuration Is Invalid");
    }

    try {
      await tActions.importMapping.update({
        db: data.locals.db,
        id,
        data: {
          configuration: configurationProcessed.data,
          ...restData,
        },
      });
    } catch (e) {
      return setError(form, "Import Mapping Update Error");
    }

    redirect(
      302,
      prevPage ||
        urlGenerator({
          address: "/(loggedIn)/importMapping",
          searchParamsValue: {},
        }).url,
    );
  },
};
