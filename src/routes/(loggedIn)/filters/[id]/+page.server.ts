import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo, urlGenerator } from '$lib/routes';
import { defaultJournalFilter, updateJournalSchema } from '$lib/schema/journalSchema';
import { createReusableFilterFormSchema } from '$lib/schema/reusableFilterSchema';
import { journalFilterToText } from '$lib/server/db/actions/helpers/journalFilterToQuery';
import { journalUpdateToText } from '$lib/server/db/actions/helpers/journalUpdateToText';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';
import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';

export const load = async (data) => {
	authGuard(data);
	const { current } = serverPageInfo(data.route.id, data);

	if (!current.params) {
		throw redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/filters', searchParamsValue: {} }).url
		);
	}

	const reusableFilter = await tActions.reusableFitler.getById({ db, id: current.params.id });

	if (!reusableFilter) {
		throw redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/filters', searchParamsValue: {} }).url
		);
	}

	const change = current.searchParams?.change || reusableFilter.change;
	const changeText = await journalUpdateToText(change);
	const filter = current.searchParams?.filter || reusableFilter.filter;
	const filterText = await journalFilterToText(filter);

	const form = await superValidate(
		{
			filter: JSON.stringify(filter),
			change: change ? JSON.stringify(change) : undefined,
			title: current.searchParams?.title || reusableFilter.title,
			applyAutomatically:
				current.searchParams?.applyAutomatically || reusableFilter.applyAutomatically,
			applyFollowingImport:
				current.searchParams?.applyFollowingImport || reusableFilter.applyFollowingImport,
			listed: current.searchParams?.listed || reusableFilter.listed,
			modificationType: current.searchParams?.modificationType || reusableFilter.modificationType
		},
		createReusableFilterFormSchema
	);

	const modificationForm = await superValidate(change || {}, updateJournalSchema);

	const numberResults = await tActions.journal.count(db, filter);

	return {
		searchParams: current.searchParams,
		numberResults,
		id: current.params.id,
		filter: reusableFilter,
		form,
		modificationForm,
		filterText,
		changeText,
		dropdowns: {
			accounts: tActions.account.listForDropdown({ db }),
			categories: tActions.category.listForDropdown({ db }),
			budgets: tActions.budget.listForDropdown({ db }),
			bills: tActions.bill.listForDropdown({ db }),
			tags: tActions.tag.listForDropdown({ db }),
			labels: tActions.label.listForDropdown({ db })
		}
	};
};
