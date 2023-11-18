import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import {
	defaultJournalFilter,
	journalFilterSchema,
	updateJournalSchema
} from '$lib/schema/journalSchema.js';
import {
	createReusableFilterFormSchema,
	createReusableFilterSchema
} from '$lib/schema/reusableFilterSchema.js';
import { journalFilterToText } from '$lib/server/db/actions/helpers/journalFilterToQuery.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { setError, superValidate } from 'sveltekit-superforms/server';
import { db } from '$lib/server/db/db.js';
import { journalUpdateToText } from '$lib/server/db/actions/helpers/journalUpdateToText.js';
import { reusableFilterPageAndFilterValidation } from '$lib/schema/pageAndFilterValidation.js';
import { redirect } from '@sveltejs/kit';
import { dropdownItems } from '$lib/server/dropdownItems.js';

export const load = async (data) => {
	authGuard(data);
	const { current } = serverPageInfo(data.route.id, data);

	const filter = current.searchParams?.filter || defaultJournalFilter();
	const change = current.searchParams?.change;

	const filterText = await journalFilterToText(filter);
	const changeText = change ? await journalUpdateToText(change) : undefined;

	const form = await superValidate(
		{
			filter: JSON.stringify(filter),
			change: change ? JSON.stringify(change) : undefined,
			title: current.searchParams?.title || filterText.join(', '),
			group: current.searchParams?.group || undefined,
			applyAutomatically: current.searchParams?.applyAutomatically,
			applyFollowingImport: current.searchParams?.applyFollowingImport,
			listed: current.searchParams?.listed,
			modificationType: current.searchParams?.modificationType
		},
		createReusableFilterFormSchema
	);

	const modificationForm = await superValidate(change || {}, updateJournalSchema);

	const numberResults = await tActions.journal.count(db, filter);

	return {
		searchParams: current.searchParams,
		form,
		modificationForm,
		filterText,
		changeText,
		dropdowns: dropdownItems({ db }),
		numberResults
	};
};

const filterFormSchemaWithPage = createReusableFilterFormSchema.merge(
	reusableFilterPageAndFilterValidation
);

export const actions = {
	default: async (data) => {
		const form = await superValidate(data.request, filterFormSchemaWithPage);

		if (!form.valid) {
			return form;
		}

		const {
			filter: filterText,
			change: changeText,
			prevPage,
			currentPage,
			...restForm
		} = form.data;

		if (!filterText) {
			return setError(form, 'Filter Is Required');
		}

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
			change: change ? change.data : undefined,
			filter: filter.data
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
