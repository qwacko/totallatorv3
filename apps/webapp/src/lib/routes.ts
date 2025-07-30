import { skRoutes } from "skroutes";
import * as z from "zod";

import { tagFilterSchema } from "@totallator/shared";
import { billFilterSchema } from "@totallator/shared";
import { budgetFilterSchema } from "@totallator/shared";
import { categoryFilterSchema } from "@totallator/shared";
import { labelFilterSchema } from "@totallator/shared";
import { accountFilterSchema } from "@totallator/shared";
import {
  defaultJournalFilter,
  journalFilterSchema,
  journalFilterSchemaWithoutPagination,
} from "@totallator/shared";
import { downloadTypeSchema, idSchema } from "@totallator/shared";
// import { downloadTypeSchema } from './schema/downloadTypeSchema';
import {
  reusableFilterCreationURLParams,
  reusableFilterFilterSchema,
} from "@totallator/shared";
import { importMappingFilterSchema } from "@totallator/shared";
import { dateSpanEnum } from "@totallator/shared";
import { importFilterSchema } from "@totallator/shared";
import { autoImportFilterSchema } from "@totallator/shared";
import { createFileNoteRelationshipSchema } from "@totallator/shared";
import { fileFilterSchema } from "@totallator/shared";
import {
  groupedQueryLogFilter,
  queryLogFilterSchema,
} from "@totallator/shared";
import { associatedInfoFilterSchemaWithPagination } from "@totallator/shared";

export const { serverPageInfo, pageInfo, urlGenerator, pageInfoStore } =
  skRoutes({
    errorURL: "/",
    config: {
      "/": {},
      "/(loggedIn)/backup": {
        searchParamsValidation: z
          .object({ page: z.coerce.number<number>().optional().default(0) })
          .optional()
          .catch({ page: 0 }).parse,
      },
      "/(loggedIn)/backup/[id]": {
        paramsValidation: z.object({ id: z.string() }).parse,
      },
      "/(loggedIn)/backup/download/[filename]": {
        paramsValidation: z.object({ filename: z.string() }).parse,
      },
      "/(loggedIn)/backup/import": {},

      // Bulk Data Load
      // ----------------------------------------
      "/(loggedIn)/dev/bulkLoad": {},

      // Settings
      // ----------------------------------------
      "/(loggedIn)/settings": {},

      // LLM
      // ----------------------------------------
      "/(loggedIn)/llm/providers": {},
      "/(loggedIn)/llm/providers/create": {},
      "/(loggedIn)/llm/providers/[id]": {
        paramsValidation: z.object({ id: z.string() }).parse,
      },
      "/(loggedIn)/llm/providers/[id]/delete": {
        paramsValidation: z.object({ id: z.string() }).parse,
      },
      "/(loggedIn)/llm/logs": {
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
          .catch({ page: 0, pageSize: 20 }).parse,
      },
      "/(loggedIn)/llm/logs/[id]": {
        paramsValidation: z.object({ id: z.string() }).parse,
      },

      // Imports
      // ----------------------------------------
      "/(loggedIn)/import": {
        searchParamsValidation: importFilterSchema.optional().catch({}).parse,
      },
      "/(loggedIn)/import/create": {},
      "/(loggedIn)/import/[id]": { paramsValidation: idSchema.parse },
      "/(loggedIn)/import/[id]/forget": { paramsValidation: idSchema.parse },
      "/(loggedIn)/import/[id]/delete": { paramsValidation: idSchema.parse },
      "/(loggedIn)/import/[id]/deleteLinked": {
        paramsValidation: idSchema.parse,
      },

      // Import Mappings
      // ----------------------------------------
      "/(loggedIn)/importMapping": {
        searchParamsValidation: importMappingFilterSchema.catch({}).parse,
      },
      "/(loggedIn)/importMapping/create": {},
      "/(loggedIn)/importMapping/[id]": { paramsValidation: idSchema.parse },
      "/(loggedIn)/importMapping/[id]/delete": {
        paramsValidation: idSchema.parse,
      },

      // Journals
      // ----------------------------------------
      "/(loggedIn)/journals": {
        searchParamsValidation: journalFilterSchema
          .optional()
          .catch(defaultJournalFilter()).parse,
      },
      "/(loggedIn)/journals/summaryData": {
        searchParamsValidation: journalFilterSchemaWithoutPagination
          .optional()
          .catch(defaultJournalFilter()).parse,
      },
      "/(loggedIn)/journals/download": {
        searchParamsValidation: z
          .object({ ...journalFilterSchema.shape, ...downloadTypeSchema.shape })
          .optional()
          .catch(defaultJournalFilter()).parse,
      },
      "/(loggedIn)/journals/delete": {
        searchParamsValidation: journalFilterSchema
          .optional()
          .catch(defaultJournalFilter()).parse,
      },
      "/(loggedIn)/journals/bulkEdit": {
        searchParamsValidation: journalFilterSchema
          .optional()
          .catch(defaultJournalFilter()).parse,
      },
      "/(loggedIn)/journals/create": {
        searchParamsValidation: journalFilterSchema
          .optional()
          .catch(defaultJournalFilter()).parse,
      },
      "/(loggedIn)/journals/clone": {
        searchParamsValidation: journalFilterSchema
          .optional()
          .catch(defaultJournalFilter()).parse,
      },
      "/(loggedIn)/journals/[id]/edit": {
        searchParamsValidation: journalFilterSchema
          .optional()
          .catch(defaultJournalFilter()).parse,
        paramsValidation: z.object({ id: z.string() }).parse,
      },

      // Dropdown Data Collection
      // ----------------------------------------
      "/(loggedIn)/dropdowns/accounts": {},
      "/(loggedIn)/dropdowns/bills": {},
      "/(loggedIn)/dropdowns/budgets": {},
      "/(loggedIn)/dropdowns/categories": {},
      "/(loggedIn)/dropdowns/tags": {},
      "/(loggedIn)/dropdowns/labels": {},
      "/(loggedIn)/dropdowns/importMappings": {},

      // Automatic Imports
      // ----------------------------------------

      "/(loggedIn)/autoImport": {
        searchParamsValidation: autoImportFilterSchema.optional().catch({})
          .parse,
      },
      "/(loggedIn)/autoImport/create": {},
      "/(loggedIn)/autoImport/[id]": { paramsValidation: idSchema.parse },
      "/(loggedIn)/autoImport/[id]/delete": {
        paramsValidation: idSchema.parse,
      },
      "/(loggedIn)/autoImport/[id]/[filename]": {
        paramsValidation: z.object({ id: z.string(), filename: z.string() })
          .parse,
      },

      // Filters
      // ----------------------------------------
      "/(loggedIn)/filters": {
        searchParamsValidation: reusableFilterFilterSchema.optional().catch({})
          .parse,
      },
      "/(loggedIn)/filters/create": {
        searchParamsValidation:
          reusableFilterCreationURLParams.optional().parse,
      },
      "/(loggedIn)/filters/[id]": {
        paramsValidation: z.object({ id: z.string() }).parse,
        searchParamsValidation:
          reusableFilterCreationURLParams.optional().parse,
      },
      "/(loggedIn)/filters/[id]/apply": {
        paramsValidation: z.object({ id: z.string() }).parse,
      },
      "/(loggedIn)/filters/[id]/delete": {
        paramsValidation: z.object({ id: z.string() }).parse,
      },

      // Accounts
      // ----------------------------------------
      "/(loggedIn)/accounts": {
        searchParamsValidation: accountFilterSchema.optional().catch({}).parse,
      },
      "/(loggedIn)/accounts/download": {
        searchParamsValidation: z
          .object({ ...accountFilterSchema.shape, ...downloadTypeSchema.shape })
          .optional()
          .catch({}).parse,
      },
      "/(loggedIn)/accounts/create": {},
      "/(loggedIn)/accounts/bulkEdit": {
        searchParamsValidation: accountFilterSchema.catch({}).parse,
      },
      "/(loggedIn)/accounts/[id]/delete": {
        paramsValidation: z.object({ id: z.string() }).parse,
      },
      // Labels
      // ----------------------------------------
      "/(loggedIn)/labels": {
        searchParamsValidation: labelFilterSchema.optional().catch({}).parse,
      },
      "/(loggedIn)/labels/download": {
        searchParamsValidation: z
          .object({ ...labelFilterSchema.shape, ...downloadTypeSchema.shape })
          .optional()
          .catch({}).parse,
      },
      "/(loggedIn)/labels/create": {},
      "/(loggedIn)/labels/[id]": {
        paramsValidation: z.object({ id: z.string() }).parse,
      },
      "/(loggedIn)/labels/[id]/delete": {
        paramsValidation: z.object({ id: z.string() }).parse,
      },
      // Tags
      // ----------------------------------------
      "/(loggedIn)/tags": {
        searchParamsValidation: tagFilterSchema.optional().catch({}).parse,
      },
      "/(loggedIn)/tags/download": {
        searchParamsValidation: z
          .object({ ...tagFilterSchema.shape, ...downloadTypeSchema.shape })
          .optional()
          .catch({}).parse,
      },
      "/(loggedIn)/tags/create": {},
      "/(loggedIn)/tags/[id]": {
        paramsValidation: z.object({ id: z.string() }).parse,
      },
      "/(loggedIn)/tags/[id]/delete": {
        paramsValidation: z.object({ id: z.string() }).parse,
      },

      // Categories
      // ----------------------------------------
      "/(loggedIn)/categories": {
        searchParamsValidation: categoryFilterSchema.optional().catch({}).parse,
      },
      "/(loggedIn)/categories/download": {
        searchParamsValidation: z
          .object({
            ...categoryFilterSchema.shape,
            ...downloadTypeSchema.shape,
          })
          .optional()
          .catch({}).parse,
      },
      "/(loggedIn)/categories/create": {},
      "/(loggedIn)/categories/[id]": {
        paramsValidation: z.object({ id: z.string() }).parse,
      },
      "/(loggedIn)/categories/[id]/delete": {
        paramsValidation: z.object({ id: z.string() }).parse,
      },

      // Bills
      // ----------------------------------------
      "/(loggedIn)/bills": {
        searchParamsValidation: billFilterSchema.optional().catch({}).parse,
      },
      "/(loggedIn)/bills/download": {
        searchParamsValidation: z
          .object({ ...billFilterSchema.shape, ...downloadTypeSchema.shape })
          .optional()
          .catch({}).parse,
      },
      "/(loggedIn)/bills/create": {},
      "/(loggedIn)/bills/[id]": {
        paramsValidation: z.object({ id: z.string() }).parse,
      },
      "/(loggedIn)/bills/[id]/delete": {
        paramsValidation: z.object({ id: z.string() }).parse,
      },

      // Budgets
      // ----------------------------------------
      "/(loggedIn)/budgets": {
        searchParamsValidation: budgetFilterSchema.optional().catch({}).parse,
      },
      "/(loggedIn)/budgets/download": {
        searchParamsValidation: z
          .object({ ...budgetFilterSchema.shape, ...downloadTypeSchema.shape })
          .optional()
          .catch({}).parse,
      },
      "/(loggedIn)/budgets/create": {},
      "/(loggedIn)/budgets/[id]": {
        paramsValidation: z.object({ id: z.string() }).parse,
      },
      "/(loggedIn)/budgets/[id]/delete": {
        paramsValidation: z.object({ id: z.string() }).parse,
      },

      // Reports
      // ----------------------------------------
      "/(loggedIn)/reports": {},
      "/(loggedIn)/reports/create": {},
      "/(loggedIn)/reports/[id]": {
        paramsValidation: z.object({ id: z.string() }).parse,
        searchParamsValidation: z
          .object({ dateSpan: z.enum(dateSpanEnum).optional() })
          .optional()
          .catch({}).parse,
      },
      "/(loggedIn)/reports/[id]/delete": {
        paramsValidation: z.object({ id: z.string() }).parse,
      },
      "/(loggedIn)/reports/element/[id]": {
        paramsValidation: z.object({ id: z.string() }).parse,
      },
      "/(loggedIn)/reports/element/[id]/[item]": {
        paramsValidation: z.object({ id: z.string(), item: z.string() }).parse,
      },

      // Associated Info
      // ----------------------------------------
      "/(loggedIn)/associated": {
        searchParamsValidation: associatedInfoFilterSchemaWithPagination
          .optional()
          .catch({}).parse,
      },

      // Files
      // ----------------------------------------
      "/(loggedIn)/files/[id]": {
        paramsValidation: z.object({ id: z.string() }).parse,
      },
      "/(loggedIn)/files/[id]/delete": {
        paramsValidation: z.object({ id: z.string() }).parse,
      },
      "/(loggedIn)/files/[id]/[filename]": {
        paramsValidation: z.object({ id: z.string(), filename: z.string() })
          .parse,
      },
      "/(loggedIn)/files/[id]/image/[filename]": {
        paramsValidation: z.object({ id: z.string(), filename: z.string() })
          .parse,
      },
      "/(loggedIn)/files/linkUnlinked": {
        searchParamsValidation: z.object(createFileNoteRelationshipSchema)
          .parse,
      },
      "/(loggedIn)/files/linkToTransaction/[id]": {
        paramsValidation: z.object({ id: z.string() }).parse,
      },
      "/(loggedIn)/files": {
        searchParamsValidation: fileFilterSchema.optional().catch({}).parse,
      },
      "/(loggedIn)/files/create": {},

      // Query Logging
      // ----------------------------------------
      "/(loggedIn)/queries/grouped": {
        searchParamsValidation: groupedQueryLogFilter.optional().catch({})
          .parse,
      },
      "/(loggedIn)/queries/list": {
        searchParamsValidation: queryLogFilterSchema.optional().catch({}).parse,
      },

      // Users
      // ----------------------------------------
      "/(loggedIn)/logout": {},
      "/(loggedIn)/users": {
        searchParamsValidation: z
          .object({ page: z.coerce.number<number>().optional().default(0) })
          .optional()
          .catch({ page: 0 }).parse,
      },
      "/(loggedIn)/users/create": {},
      "/(loggedIn)/users/[id]": {
        paramsValidation: z.object({ id: z.string() }).parse,
      },
      "/(loggedIn)/users/[id]/delete": {
        paramsValidation: z.object({ id: z.string() }).parse,
      },
      "/(loggedIn)/users/[id]/password": {
        paramsValidation: z.object({ id: z.string() }).parse,
      },

      "/(loggedOut)/login": {},
      "/(loggedOut)/signup": {},
      "/(loggedOut)/firstUser": {},

      "/(loggedIn)/testFunctions": {},
    },
  });
