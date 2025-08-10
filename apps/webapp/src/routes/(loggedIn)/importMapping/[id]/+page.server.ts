import { redirect } from "@sveltejs/kit";
import type { SingleServerRouteConfig } from "skroutes";
import { setError, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

import { tActions } from "@totallator/business-logic";
import {
  idSchema,
  importMappingDetailSchema,
  importMappingDetailWithRefinementSchema,
  importMappingUpdateFormSchema,
} from "@totallator/shared";
import type { ImportFilterSchemaType } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { serverPageInfo, urlGeneratorServer } from "$lib/routes.server";
import { bufferingHelper } from "$lib/server/bufferingHelper.js";

export const load = async (data) => {
  authGuard(data);
  const { current } = serverPageInfo(data.route.id, data);
  bufferingHelper(data);

  if (!current.params) {
    redirect(
      302,
      urlGeneratorServer({
        address: "/(loggedIn)/importMapping",
        searchParamsValue: {},
      }).url,
    );
  }

  const importMapping = await tActions.importMapping.getById({
    id: current.params.id,
  });

  if (!importMapping) {
    redirect(
      302,
      urlGeneratorServer({
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
        urlGeneratorServer({
          address: "/(loggedIn)/importMapping",
          searchParamsValue: {},
        }).url,
    );
  },
};

export const _routeConfig = {
  paramsValidation: idSchema,
} satisfies SingleServerRouteConfig;
