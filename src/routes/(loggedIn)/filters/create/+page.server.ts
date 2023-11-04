import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { defaultJournalFilter } from '$lib/schema/journalSchema.js';
import { createReusableFilterSchema } from '$lib/schema/reusableFilterSchema.js';
import { journalFilterToText } from '$lib/server/db/actions/helpers/journalFilterToQuery.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { superValidate } from 'sveltekit-superforms/server';
import { db } from '$lib/server/db/db.js';
import { journalUpdateToText } from '$lib/server/db/actions/helpers/journalUpdateToText.js';

export const load = async (data) => {
	authGuard(data);
	const { current } = serverPageInfo(data.route.id, data);

	const form = await superValidate(
		{ filter: current.searchParams?.filter || defaultJournalFilter() },
		createReusableFilterSchema
	);

	const numberResults = await tActions.journal.count(
		db,
		current.searchParams?.filter || defaultJournalFilter()
	);

	return {
		searchParams: current.searchParams,
		form,
		filterText: journalFilterToText(current.searchParams?.filter || defaultJournalFilter()),
		changeText: current.searchParams?.change
			? await journalUpdateToText(current.searchParams.change)
			: undefined,
		dropdowns: {
			account: tActions.account.listForDropdown({ db }),
			category: tActions.category.listForDropdown({ db }),
			budget: tActions.budget.listForDropdown({ db }),
			bill: tActions.bill.listForDropdown({ db }),
			tag: tActions.tag.listForDropdown({ db }),
			label: tActions.label.listForDropdown({ db })
		},
		numberResults
	};
};
