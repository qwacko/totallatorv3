import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo, urlGenerator } from '$lib/routes.js';
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
import { z } from 'zod';
import { pageAndFilterValidation } from '$lib/schema/pageAndFilterValidation';

export const load = async (data) => {
	authGuard(data);
	const pageInfo = serverPageInfo(data.route.id, data);

	const journalData = await tActions.journal.listWithCommonData({
		db: db,
		filter: pageInfo.current.searchParams || defaultJournalFilter()
	});

	const { allLabelIds, commonLabelIds, ...journalDataForForm } = journalData.common;

	const form = await superValidate(journalDataForForm, updateJournalSchema);

	return {
		selectedJournals: {
			reconciled: journalData.common.reconciled,
			complete: journalData.common.complete,
			dataChecked: journalData.common.dataChecked,
			count: journalData.journals.data.length,
			canEdit: journalData.common.complete === false
		},
		form,
		allLabelIds,
		commonLabelIds
	};
};
const updateStateActionValidation = pageAndFilterValidation.merge(
	z.object({
		action: z.enum([
			'reconciled',
			'complete',
			'dataChecked',
			'unreconciled',
			'incomplete',
			'dataNotChecked'
		])
	})
);

const updateValidation = updateJournalSchema.merge(pageAndFilterValidation);

export const actions = {
	updateState: async ({ request }) => {
		const form = await superValidate(request, updateStateActionValidation);

		if (!form.valid) {
			throw redirect(302, form.data.currentPage);
		}

		const parsedFilter = journalFilterSchema.safeParse(JSON.parse(form.data.filter));

		if (!parsedFilter.success) {
			throw redirect(302, form.data.currentPage);
		}

		try {
			if (form.data.action === 'complete') {
				await tActions.journal.markManyComplete({
					db,
					journalFilter: parsedFilter.data
				});
			} else if (form.data.action === 'incomplete') {
				await tActions.journal.markManyUncomplete({
					db,
					journalFilter: parsedFilter.data
				});
			} else {
				const reconciled =
					form.data.action === 'reconciled'
						? true
						: form.data.action === 'unreconciled'
						? false
						: undefined;
				const dataChecked =
					form.data.action === 'dataChecked'
						? true
						: form.data.action === 'dataNotChecked'
						? false
						: undefined;

				await tActions.journal.updateJournals({
					db,
					filter: parsedFilter.data,
					journalData: {
						reconciled,
						dataChecked
					}
				});
			}
		} catch (e) {
			logging.error('Error Updating Journal State : ', e);
			throw redirect(
				302,
				form.data.prevPage ||
					urlGenerator({
						address: '/(loggedIn)/journals',
						searchParamsValue: defaultJournalFilter()
					}).url
			);
		}

		throw redirect(302, form.data.prevPage);
	},
	update: async ({ request }) => {
		const form = await superValidate(request, updateValidation);

		if (!form.valid) {
			logging.error('Update Form Is Not Valid');
			throw redirect(302, form.data.currentPage);
		}

		const parsedFilter = journalFilterSchema.safeParse(JSON.parse(form.data.filter));

		if (!parsedFilter.success) {
			logging.error('Update Filter Is Not Valid');
			throw redirect(302, form.data.currentPage);
		}

		try {
			await tActions.journal.updateJournals({
				db,
				filter: parsedFilter.data,
				journalData: form.data
			});
		} catch (e) {
			logging.error('Error Updating Journals : ', e);

			return message(form, 'Error Updating Journals');
		}

		throw redirect(302, form.data.prevPage);
	}
};
