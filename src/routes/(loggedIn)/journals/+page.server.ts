import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import {
	journalFilterSchemaWithoutPagination,
	journalFilterSchema,
	updateJournalSchema,
	type JournalFilterSchemaType
} from '$lib/schema/journalSchema';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { logging } from '$lib/server/logging';
import { noteFormActions } from '$lib/server/noteFormActions.js';
import { redirect } from '@sveltejs/kit';
import { fileFormActions } from '$lib/server/fileFormActions';
import { associatedInfoFormActions } from '$lib/server/associatednfoFormActions.js';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

export const load = async (data) => {
	authGuard(data);
	const { current: pageInfo, updateParams } = serverPageInfo(data.route.id, data);

	const filter: JournalFilterSchemaType = pageInfo.searchParams || {
		page: 0,
		pageSize: 10,
		orderBy: [{ field: 'date', direction: 'desc' }],
		account: { type: ['asset', 'liability'] }
	};

	const { pageSize, page, orderBy, ...searchParamsWithoutPagination } = filter;

	if (filter.pageSize > 500) {
		redirect(302, updateParams({ searchParams: { pageSize: 10 } }).url);
	}

	const latestUpdate = await tActions.journalView.getLatestUpdateDate({ db: data.locals.db });

	return { searchParams: pageInfo.searchParams, searchParamsWithoutPagination, latestUpdate };
};

export const actions = {
	...noteFormActions,
	...fileFormActions,
	...associatedInfoFormActions,
	updateJournal: async (data) => {
		const db = data.locals.db;
		const form = await superValidate(
			data.request,
			zod(updateJournalSchema.merge(z.object({ filter: journalFilterSchemaWithoutPagination })))
		);

		if (!form.valid) {
			logging.error('Update Form Is Not Valid');
			return { form };
		}

		const parsedFilter = journalFilterSchema.safeParse(form.data.filter);

		if (!parsedFilter.success) {
			logging.error('Filter Is Not Valid');
			return { form };
		}

		console.log('Updating Journal', parsedFilter.data, form.data);

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

		return { form };
	},

	update: async (data) => {
		const form = await data.request.formData();
		const journalId = form.get('journalId')?.toString();
		const action = form.get('action')?.toString();
		if (!journalId || !action) return;
		try {
			if (action === 'uncomplete') {
				await tActions.journal.markUncomplete(data.locals.db, journalId);
			}
			if (action === 'complete') {
				await tActions.journal.markComplete(data.locals.db, journalId);
			}
			if (action === 'reconcile') {
				await tActions.journal.updateJournals({
					db: data.locals.db,
					filter: { id: journalId },
					journalData: { setReconciled: true }
				});
			}
			if (action === 'unreconcile') {
				await tActions.journal.updateJournals({
					db: data.locals.db,
					filter: { id: journalId },
					journalData: { clearReconciled: true }
				});
			}
			if (action === 'check') {
				await tActions.journal.updateJournals({
					db: data.locals.db,
					filter: { id: journalId },
					journalData: { setDataChecked: true }
				});
			}
			if (action === 'uncheck') {
				await tActions.journal.updateJournals({
					db: data.locals.db,
					filter: { id: journalId },
					journalData: { clearDataChecked: true }
				});
			}
			return;
		} catch (error) {
			logging.error(error);
			return;
		}
	}
};
