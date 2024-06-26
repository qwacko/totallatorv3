import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import {
	cloneJournalUpdateSchema,
	defaultJournalFilter,
	journalFilterSchema
} from '$lib/schema/journalSchema.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import { pageAndFilterValidation } from '$lib/schema/pageAndFilterValidation';

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;
	const pageInfo = serverPageInfo(data.route.id, data);

	const journalData = await tActions.journalView.listWithCommonData({
		db: db,
		filter: pageInfo.current.searchParams || defaultJournalFilter()
	});

	const { allLabelIds, commonLabelIds, ...journalDataForForm } = journalData.common;

	const form = await superValidate(journalDataForForm, zod(cloneJournalUpdateSchema));

	return {
		selectedJournals: {
			reconciled: journalData.common.reconciled,
			complete: journalData.common.complete,
			dataChecked: journalData.common.dataChecked,
			count: journalData.journals.data.length,
			canEdit: journalData.common.complete === false
		},
		form,
		allLabelIds: allLabelIds.filter((labelId) => !commonLabelIds.includes(labelId)),
		commonLabelIds
	};
};

const cloneValidation = cloneJournalUpdateSchema.merge(pageAndFilterValidation);

export const actions = {
	clone: async ({ request, locals }) => {
		const db = locals.db;
		const form = await superValidate(request, zod(cloneValidation));

		if (!form.valid) {
			logging.error('Clone Form Is Not Valid');
			redirect(302, form.data.currentPage);
		}

		const parsedFilter = journalFilterSchema.safeParse(JSON.parse(form.data.filter));

		if (!parsedFilter.success) {
			logging.error('Clone Filter Is Not Valid');
			redirect(302, form.data.currentPage);
		}

		try {
			await tActions.journal.cloneJournals({
				db,
				filter: parsedFilter.data,
				journalData: form.data
			});
		} catch (e) {
			logging.error('Error Cloning Journals : ', e);

			return message(form, 'Error Cloning Journals');
		}

		redirect(302, form.data.prevPage);
	}
};
