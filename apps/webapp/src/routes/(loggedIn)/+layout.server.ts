import { tActions } from "@totallator/business-logic";

import { serverEnv } from "$lib/server/serverEnv";

export const load = async ({ locals }) => {
  const latestJournalUpdate = await tActions.journalView.getLatestUpdateDate();

  return {
    filterDropdown: await tActions.reusableFitler.listForDropdown(),
    reportDropdown: await tActions.report.listForDropdown(),
    enableDBLog: serverEnv.DBLOG_ENABLE,
    latestUpdate: latestJournalUpdate,
    dataUpdated: {
      journals: latestJournalUpdate,
      bills: (await tActions.bill.latestUpdate()).getTime() || 0,
      budgets: (await tActions.budget.latestUpdate()).getTime() || 0,
      tags: (await tActions.tag.latestUpdate()).getTime() || 0,
      labels: (await tActions.label.latestUpdate()).getTime() || 0,
      accounts: (await tActions.account.latestUpdate()).getTime() || 0,
      categories: (await tActions.category.latestUpdate()).getTime() || 0,
      importMappings:
        (
          await tActions.importMapping.latestUpdate()
        ).getTime() || 0,
    },
  };
};
