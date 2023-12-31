import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo, urlGenerator } from '$lib/routes';
import { journalFilterSchema, updateJournalSchema } from '$lib/schema/journalSchema';
import { reusableFilterPageAndFilterValidation } from '$lib/schema/pageAndFilterValidation';
import {
	updateReusableFilterFormSchema,
	updateReusableFilterSchema
} from '$lib/schema/reusableFilterSchema';
import { bufferingHelper } from '$lib/server/bufferingHelper.js';
import { journalFilterToText } from '$lib/server/db/actions/helpers/journal/journalFilterToQuery';
import { journalUpdateToText } from '$lib/server/db/actions/helpers/journal/journalUpdateToText';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';
import { dropdownItems } from '$lib/server/dropdownItems.js';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms/server';

export const load = async (data) => {
	authGuard(data);
	const { current } = serverPageInfo(data.route.id, data);
	bufferingHelper(data);

	if (!current.params || !current.searchParams) {
		redirect(
        			302,
        			urlGenerator({ address: '/(loggedIn)/filters', searchParamsValue: {} }).url
        		);
	}

	const reusableFilter = await tActions.reusableFitler.getById({ db, id: current.params.id });

	if (!reusableFilter) {
		redirect(
        			302,
        			urlGenerator({ address: '/(loggedIn)/filters', searchParamsValue: {} }).url
        		);
	}

	const change = current.searchParams?.change || reusableFilter.change;
	const changeText = await journalUpdateToText({ db, change });
	const filter = current.searchParams?.filter || reusableFilter.filter;
	const filterText = await journalFilterToText({ db, filter });

	const form = await superValidate(
		{
			id: reusableFilter.id,
			filter: JSON.stringify(filter),
			change: change ? JSON.stringify(change) : undefined,
			title: current.searchParams?.title || reusableFilter.title,
			group: current.searchParams?.group || reusableFilter.group || undefined,
			applyAutomatically:
				current.searchParams?.applyAutomatically || reusableFilter.applyAutomatically,
			applyFollowingImport:
				current.searchParams?.applyFollowingImport || reusableFilter.applyFollowingImport,
			listed: current.searchParams?.listed || reusableFilter.listed,
			modificationType:
				current.searchParams?.modificationType || reusableFilter.modificationType || undefined
		},
		updateReusableFilterFormSchema
	);

	const modificationForm = await superValidate(change || {}, updateJournalSchema);

	const numberResults = await tActions.journal.count(db, filter);

	return {
		searchParams: current.searchParams,
		numberResults,
		id: reusableFilter.id,
		filter: reusableFilter,
		form,
		modificationForm,
		filterText,
		changeText,
		dropdowns: dropdownItems({ db })
	};
};

const filterFormSchemaWithPage = updateReusableFilterFormSchema.merge(
	reusableFilterPageAndFilterValidation
);

export const actions = {
	default: async (data) => {
		const form = await superValidate(data.request, filterFormSchemaWithPage);

		if (!form.valid) {
			return form;
		}

		const {
			id,
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

		const processedUpdate = updateReusableFilterSchema.safeParse({
			...restForm,
			change: change ? change.data : undefined,
			filter: filter.data
		});

		if (!processedUpdate.success) {
			logging.error('Update Filter Error', JSON.stringify(processedUpdate.error, null, 2));
			return setError(form, 'Form Submission Error');
		}

		try {
			await tActions.reusableFitler.update({ db, id, data: processedUpdate.data });
		} catch (e) {
			return setError(form, 'Reusable Filter Update Error');
		}

		redirect(302, prevPage);
	}
};
