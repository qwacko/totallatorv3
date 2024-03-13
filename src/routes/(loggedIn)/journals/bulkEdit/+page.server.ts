import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo, urlGenerator } from '$lib/routes.js';
import {
	defaultJournalFilter,
	journalFilterSchema,
	updateJournalSchema
} from '$lib/schema/journalSchema.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { pageAndFilterValidation } from '$lib/schema/pageAndFilterValidation';

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;
	const pageInfo = serverPageInfo(data.route.id, data);

	const journalData = await tActions.journalView.listWithCommonData({
		db: db,
		filter: pageInfo.current.searchParams || defaultJournalFilter()
	});

	const {
		allLabelIds,
		commonLabelIds,
		reconciled,
		dataChecked,
		complete,
		linked,
		...journalDataForForm
	} = journalData.common;

	const form = await superValidate(
		{
			...journalDataForForm,
			setReconciled: reconciled === true ? true : undefined,
			clearReconciled: reconciled === false ? true : undefined,
			setDataChecked: dataChecked === true ? true : undefined,
			clearDataChecked: dataChecked === false ? true : undefined,
			setComplete: complete === true ? true : undefined,
			clearComplete: complete === false ? true : undefined,
			setLinked: linked === true ? true : undefined,
			clearLinked: linked === false ? true : undefined
		},
		zod(updateJournalSchema)
	);

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
	updateState: async ({ request, locals }) => {
		const db = locals.db;
		const form = await superValidate(request, zod(updateStateActionValidation));

		if (!form.valid) {
			redirect(302, form.data.currentPage);
		}

		const parsedFilter = journalFilterSchema.safeParse(JSON.parse(form.data.filter));

		if (!parsedFilter.success) {
			redirect(302, form.data.currentPage);
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
				const setReconciled = form.data.action === 'reconciled';
				const clearReconciled = form.data.action === 'unreconciled';
				const setDataChecked = form.data.action === 'dataChecked';
				const clearDataChecked = form.data.action === 'dataNotChecked';

				await tActions.journal.updateJournals({
					db,
					filter: parsedFilter.data,
					journalData: {
						setReconciled,
						clearReconciled,
						setDataChecked,
						clearDataChecked
					}
				});
			}
		} catch (e) {
			logging.error('Error Updating Journal State : ', e);
			redirect(
				302,
				form.data.prevPage ||
					urlGenerator({
						address: '/(loggedIn)/journals',
						searchParamsValue: defaultJournalFilter()
					}).url
			);
		}

		redirect(302, form.data.prevPage);
	},
	update: async ({ request, locals }) => {
		const db = locals.db;
		const form = await superValidate(request, zod(updateValidation));

		if (!form.valid) {
			logging.error('Update Form Is Not Valid');
			redirect(302, form.data.currentPage);
		}

		const parsedFilter = journalFilterSchema.safeParse(JSON.parse(form.data.filter));

		if (!parsedFilter.success) {
			logging.error('Update Filter Is Not Valid');
			redirect(302, form.data.currentPage);
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

		redirect(302, form.data.prevPage);
	}
};
