import { type RouteConfig } from "skroutes";
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
  cronExecutionFilterSchema,
  cronJobUrlFilterSchema,
} from "@totallator/shared";
import {
  groupedQueryLogFilter,
  queryLogFilterSchema,
} from "@totallator/shared";
import { associatedInfoFilterSchemaWithPagination } from "@totallator/shared";

export const skConfig = {
  "/": {},
  "/(loggedIn)/backup": {
    searchParamsValidation: z
      .object({ page: z.coerce.number<number>().optional().default(0) })
      .optional()
      .catch({ page: 0 }),
  },

  "/(loggedIn)/backup/[id]": {
    paramsValidation: z.object({ id: z.string() }),
  },
  "/(loggedIn)/backup/download/[filename]": {
    paramsValidation: z.object({ filename: z.string() }),
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
    paramsValidation: z.object({ id: z.string() }),
  },
  "/(loggedIn)/llm/providers/[id]/delete": {
    paramsValidation: z.object({ id: z.string() }),
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
      .catch({ page: 0, pageSize: 20 }),
  },
  "/(loggedIn)/llm/logs/[id]": {
    paramsValidation: z.object({ id: z.string() }),
  },

  // Imports
  // ----------------------------------------
  "/(loggedIn)/import": {
    searchParamsValidation: importFilterSchema.optional().catch({}),
  },
  "/(loggedIn)/import/create": {},
  "/(loggedIn)/import/[id]": { paramsValidation: idSchema },
  "/(loggedIn)/import/[id]/forget": { paramsValidation: idSchema },
  "/(loggedIn)/import/[id]/delete": { paramsValidation: idSchema },
  "/(loggedIn)/import/[id]/deleteLinked": {
    paramsValidation: idSchema,
  },

  // Import Mappings
  // ----------------------------------------
  "/(loggedIn)/importMapping": {
    searchParamsValidation: importMappingFilterSchema.catch({}),
  },
  "/(loggedIn)/importMapping/create": {},
  "/(loggedIn)/importMapping/[id]": { paramsValidation: idSchema },
  "/(loggedIn)/importMapping/[id]/delete": {
    paramsValidation: idSchema,
  },

  // Journals
  // ----------------------------------------
  "/(loggedIn)/journals": {
    searchParamsValidation: journalFilterSchema
      .optional()
      .catch(defaultJournalFilter()),
  },
  "/(loggedIn)/journals/summaryData": {
    searchParamsValidation: journalFilterSchemaWithoutPagination
      .optional()
      .catch(defaultJournalFilter()),
  },
  "/(loggedIn)/journals/download": {
    searchParamsValidation: z
      .object({ ...journalFilterSchema.shape, ...downloadTypeSchema.shape })
      .optional()
      .catch(defaultJournalFilter()),
  },
  "/(loggedIn)/journals/delete": {
    searchParamsValidation: journalFilterSchema
      .optional()
      .catch(defaultJournalFilter()),
  },
  "/(loggedIn)/journals/bulkEdit": {
    searchParamsValidation: journalFilterSchema
      .optional()
      .catch(defaultJournalFilter()),
  },
  "/(loggedIn)/journals/create": {
    searchParamsValidation: journalFilterSchema
      .optional()
      .catch(defaultJournalFilter()),
  },
  "/(loggedIn)/journals/clone": {
    searchParamsValidation: journalFilterSchema
      .optional()
      .catch(defaultJournalFilter()),
  },
  "/(loggedIn)/journals/[id]/edit": {
    searchParamsValidation: journalFilterSchema
      .optional()
      .catch(defaultJournalFilter()),
    paramsValidation: z.object({ id: z.string() }),
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
    searchParamsValidation: autoImportFilterSchema.optional().catch({}),
  },
  "/(loggedIn)/autoImport/create": {},
  "/(loggedIn)/autoImport/[id]": { paramsValidation: idSchema },
  "/(loggedIn)/autoImport/[id]/delete": {
    paramsValidation: idSchema,
  },
  "/(loggedIn)/autoImport/[id]/[filename]": {
    paramsValidation: z.object({ id: z.string(), filename: z.string() }),
  },

  // Filters
  // ----------------------------------------
  "/(loggedIn)/filters": {
    searchParamsValidation: reusableFilterFilterSchema.optional().catch({}),
  },
  "/(loggedIn)/filters/create": {
    searchParamsValidation: reusableFilterCreationURLParams.optional(),
  },
  "/(loggedIn)/filters/[id]": {
    paramsValidation: z.object({ id: z.string() }),
    searchParamsValidation: reusableFilterCreationURLParams.optional(),
  },
  "/(loggedIn)/filters/[id]/apply": {
    paramsValidation: z.object({ id: z.string() }),
  },
  "/(loggedIn)/filters/[id]/delete": {
    paramsValidation: z.object({ id: z.string() }),
  },

  // Accounts
  // ----------------------------------------
  "/(loggedIn)/accounts": {
    searchParamsValidation: accountFilterSchema.optional().catch({}),
  },
  "/(loggedIn)/accounts/download": {
    searchParamsValidation: z
      .object({ ...accountFilterSchema.shape, ...downloadTypeSchema.shape })
      .optional()
      .catch({}),
  },
  "/(loggedIn)/accounts/create": {},
  "/(loggedIn)/accounts/bulkEdit": {
    searchParamsValidation: accountFilterSchema.catch({}),
  },
  "/(loggedIn)/accounts/[id]/delete": {
    paramsValidation: z.object({ id: z.string() }),
  },
  // Labels
  // ----------------------------------------
  "/(loggedIn)/labels": {
    searchParamsValidation: labelFilterSchema.optional().catch({}),
  },
  "/(loggedIn)/labels/download": {
    searchParamsValidation: z
      .object({ ...labelFilterSchema.shape, ...downloadTypeSchema.shape })
      .optional()
      .catch({}),
  },
  "/(loggedIn)/labels/create": {},
  "/(loggedIn)/labels/[id]": {
    paramsValidation: z.object({ id: z.string() }),
  },
  "/(loggedIn)/labels/[id]/delete": {
    paramsValidation: z.object({ id: z.string() }),
  },
  // Tags
  // ----------------------------------------
  "/(loggedIn)/tags": {
    searchParamsValidation: tagFilterSchema.optional().catch({}),
  },
  "/(loggedIn)/tags/download": {
    searchParamsValidation: z
      .object({ ...tagFilterSchema.shape, ...downloadTypeSchema.shape })
      .optional()
      .catch({}),
  },
  "/(loggedIn)/tags/create": {},
  "/(loggedIn)/tags/[id]": {
    paramsValidation: z.object({ id: z.string() }),
  },
  "/(loggedIn)/tags/[id]/delete": {
    paramsValidation: z.object({ id: z.string() }),
  },

  // Categories
  // ----------------------------------------
  "/(loggedIn)/categories": {
    searchParamsValidation: categoryFilterSchema.optional().catch({}),
  },
  "/(loggedIn)/categories/download": {
    searchParamsValidation: z
      .object({
        ...categoryFilterSchema.shape,
        ...downloadTypeSchema.shape,
      })
      .optional()
      .catch({}),
  },
  "/(loggedIn)/categories/create": {},
  "/(loggedIn)/categories/[id]": {
    paramsValidation: z.object({ id: z.string() }),
  },
  "/(loggedIn)/categories/[id]/delete": {
    paramsValidation: z.object({ id: z.string() }),
  },

  // Bills
  // ----------------------------------------
  "/(loggedIn)/bills": {
    searchParamsValidation: billFilterSchema.optional().catch({}),
  },
  "/(loggedIn)/bills/download": {
    searchParamsValidation: z
      .object({ ...billFilterSchema.shape, ...downloadTypeSchema.shape })
      .optional()
      .catch({}),
  },
  "/(loggedIn)/bills/create": {},
  "/(loggedIn)/bills/[id]": {
    paramsValidation: z.object({ id: z.string() }),
  },
  "/(loggedIn)/bills/[id]/delete": {
    paramsValidation: z.object({ id: z.string() }),
  },

  // Budgets
  // ----------------------------------------
  "/(loggedIn)/budgets": {
    searchParamsValidation: budgetFilterSchema.optional().catch({}),
  },
  "/(loggedIn)/budgets/download": {
    searchParamsValidation: z
      .object({ ...budgetFilterSchema.shape, ...downloadTypeSchema.shape })
      .optional()
      .catch({}),
  },
  "/(loggedIn)/budgets/create": {},
  "/(loggedIn)/budgets/[id]": {
    paramsValidation: z.object({ id: z.string() }),
  },
  "/(loggedIn)/budgets/[id]/delete": {
    paramsValidation: z.object({ id: z.string() }),
  },

  // Reports
  // ----------------------------------------
  "/(loggedIn)/reports": {},
  "/(loggedIn)/reports/create": {},
  "/(loggedIn)/reports/[id]": {
    paramsValidation: z.object({ id: z.string() }),
    searchParamsValidation: z
      .object({ dateSpan: z.enum(dateSpanEnum).optional() })
      .optional()
      .catch({}),
  },
  "/(loggedIn)/reports/[id]/delete": {
    paramsValidation: z.object({ id: z.string() }),
  },
  "/(loggedIn)/reports/element/[id]": {
    paramsValidation: z.object({ id: z.string() }),
  },
  "/(loggedIn)/reports/element/[id]/[item]": {
    paramsValidation: z.object({ id: z.string(), item: z.string() }),
  },

  // Associated Info
  // ----------------------------------------
  "/(loggedIn)/associated": {
    searchParamsValidation: associatedInfoFilterSchemaWithPagination
      .optional()
      .catch({}),
  },

  // Files
  // ----------------------------------------
  "/(loggedIn)/files/[id]": {
    paramsValidation: z.object({ id: z.string() }),
  },
  "/(loggedIn)/files/[id]/delete": {
    paramsValidation: z.object({ id: z.string() }),
  },
  "/(loggedIn)/files/[id]/[filename]": {
    paramsValidation: z.object({ id: z.string(), filename: z.string() }),
  },
  "/(loggedIn)/files/[id]/image/[filename]": {
    paramsValidation: z.object({ id: z.string(), filename: z.string() }),
  },
  "/(loggedIn)/files/linkUnlinked": {
    searchParamsValidation: z.object(createFileNoteRelationshipSchema),
  },
  "/(loggedIn)/files/linkToTransaction/[id]": {
    paramsValidation: z.object({ id: z.string() }),
  },
  "/(loggedIn)/files": {
    searchParamsValidation: fileFilterSchema.optional().catch({}),
  },
  "/(loggedIn)/files/create": {},

  // Query Logging
  // ----------------------------------------
  "/(loggedIn)/queries/grouped": {
    searchParamsValidation: groupedQueryLogFilter.optional().catch({}),
  },
  "/(loggedIn)/queries/list": {
    searchParamsValidation: queryLogFilterSchema.optional().catch({}),
  },

  // Admin - Cron Jobs
  // ----------------------------------------
  "/(loggedIn)/admin/cron": {
    searchParamsValidation: cronJobUrlFilterSchema.optional().catch({}),
  },
  "/(loggedIn)/admin/cron/executions": {
    searchParamsValidation: cronExecutionFilterSchema.optional().catch({
      page: 0,
      pageSize: 25,
      orderBy: [{ field: "startedAt", direction: "desc" }],
    }),
  },
  "/(loggedIn)/admin/cron/[id]": {
    paramsValidation: z.object({ id: z.string() }),
  },

  // Users
  // ----------------------------------------
  "/(loggedIn)/logout": {},
  "/(loggedIn)/users": {
    searchParamsValidation: z
      .object({ page: z.coerce.number<number>().optional().default(0) })
      .optional()
      .catch({ page: 0 }),
  },
  "/(loggedIn)/users/create": {},
  "/(loggedIn)/users/[id]": {
    paramsValidation: z.object({ id: z.string() }),
  },
  "/(loggedIn)/users/[id]/delete": {
    paramsValidation: z.object({ id: z.string() }),
  },
  "/(loggedIn)/users/[id]/password": {
    paramsValidation: z.object({ id: z.string() }),
  },

  "/(loggedOut)/login": {},
  "/(loggedOut)/signup": {},
  "/(loggedOut)/firstUser": {},

  "/(loggedIn)/testFunctions": {},
} satisfies RouteConfig;
