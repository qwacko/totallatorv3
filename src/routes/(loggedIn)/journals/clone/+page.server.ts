import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import {
	defaultJournalFilter,
	journalFilterSchema,
	updateJournalSchema
} from '$lib/schema/journalSchema.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db.js';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';

import { pageAndFilterValidation } from '$lib/schema/pageAndFilterValidation';

export const load = async (data) => {
	authGuard(data);
	const pageInfo = serverPageInfo(data.route.id, data);

	const journalData = await tActions.journal.listWithCommonData({
		db: db,
		filter: pageInfo.current.searchParams || defaultJournalFilter
	});

	const form = await superValidate(journalData.common, updateJournalSchema);

	return {
		selectedJournals: {
			reconciled: journalData.common.reconciled,
			complete: journalData.common.complete,
			dataChecked: journalData.common.dataChecked,
			count: journalData.journals.data.length,
			canEdit: journalData.common.complete === false
		},
		form
	};
};

const cloneValidation = updateJournalSchema.merge(pageAndFilterValidation);

export const actions = {
	clone: async ({ request }) => {
		const form = await superValidate(request, cloneValidation);

		if (!form.valid) {
			logging.error('Clone Form Is Not Valid');
			throw redirect(302, form.data.currentPage);
		}

		const parsedFilter = journalFilterSchema.safeParse(JSON.parse(form.data.filter));

		if (!parsedFilter.success) {
			logging.error('Clone Filter Is Not Valid');
			throw redirect(302, form.data.currentPage);
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

		throw redirect(302, form.data.prevPage);
	}
};
