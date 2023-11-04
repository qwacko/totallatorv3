import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import {
	defaultJournalFilter,
	journalFilterSchema,
	updateJournalSchema
} from '$lib/schema/journalSchema.js';
import {
	createReusableFilterFormSchema,
	createReusableFilterSchema,
	reusableFilterCreationURLParams
} from '$lib/schema/reusableFilterSchema.js';
import { journalFilterToText } from '$lib/server/db/actions/helpers/journalFilterToQuery.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { setError, superValidate } from 'sveltekit-superforms/server';
import { db } from '$lib/server/db/db.js';
import { journalUpdateToText } from '$lib/server/db/actions/helpers/journalUpdateToText.js';
import { reusableFilterPageAndFilterValidation } from '$lib/schema/pageAndFilterValidation.js';
import { redirect } from '@sveltejs/kit';

const getUrlParams = (query: string): Record<string, unknown> =>
	Array.from(new URLSearchParams(query)).reduce(
		(p, [k, v]) => {
			try {
				const newValue: unknown = JSON.parse(v);
				return { ...p, [k]: newValue };
			} catch {
				return { ...p, [k]: v };
			}
		},
		{} as Record<string, unknown>
	);

export const load = async (data) => {
	authGuard(data);
	const { current } = serverPageInfo(data.route.id, data);

	const filterText = await journalFilterToText(
		current.searchParams?.filter || defaultJournalFilter()
	);

	const processedParams = reusableFilterCreationURLParams.safeParse(
		getUrlParams(data.url.searchParams.toString())
	);

	console.log('Processed params', JSON.stringify(processedParams, null, 2));

	const form = await superValidate(
		{
			filter: JSON.stringify(current.searchParams?.filter || defaultJournalFilter()),
			title: filterText.join(', '),
			applyAutomatically: current.searchParams?.applyAutomatically,
			applyFollowingImport: current.searchParams?.applyFollowingImport,
			automaticFrequency: current.searchParams?.automaticFrequency,
			listed: current.searchParams?.listed,
			modificationType: current.searchParams?.modificationType
		},
		createReusableFilterFormSchema
	);

	const modificationForm = await superValidate(
		current.searchParams?.change || {},
		updateJournalSchema
	);

	const numberResults = await tActions.journal.count(
		db,
		current.searchParams?.filter || defaultJournalFilter()
	);

	return {
		searchParams: current.searchParams,
		form,
		modificationForm,
		filterText,
		changeText: current.searchParams?.change
			? await journalUpdateToText(current.searchParams.change)
			: undefined,
		dropdowns: {
			accounts: tActions.account.listForDropdown({ db }),
			categories: tActions.category.listForDropdown({ db }),
			budgets: tActions.budget.listForDropdown({ db }),
			bills: tActions.bill.listForDropdown({ db }),
			tags: tActions.tag.listForDropdown({ db }),
			labels: tActions.label.listForDropdown({ db })
		},
		numberResults
	};
};

const filterFormSchemaWithPage = createReusableFilterFormSchema.merge(
	reusableFilterPageAndFilterValidation
);

export const actions = {
	default: async (data) => {
		const form = await superValidate(data.request, filterFormSchemaWithPage);

		const {
			filter: filterText,
			change: changeText,
			prevPage,
			currentPage,
			...restForm
		} = form.data;

		const filter = journalFilterSchema.safeParse(JSON.parse(filterText));

		if (!filter.success) {
			return setError(form, 'filter', 'Filter Is Invalid');
		}

		const change = changeText ? updateJournalSchema.safeParse(JSON.parse(changeText)) : undefined;

		if (change && !change.success) {
			return setError(form, 'change', 'Change Is Invalid');
		}

		const processedCreation = createReusableFilterSchema.safeParse({
			...restForm,
			change,
			filter
		});

		if (!processedCreation.success) {
			return setError(form, 'Form Submission Error');
		}

		try {
			await tActions.reusableFitler.create({ db, data: processedCreation.data });
		} catch (e) {
			return setError(form, 'Reusable Filter Creation Error');
		}

		throw redirect(302, prevPage);
	}
};
