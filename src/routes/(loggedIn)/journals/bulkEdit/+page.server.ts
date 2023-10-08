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
// import { logging } from '$lib/server/logging';
// import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';

const getCommonData = <
	T extends string,
	U extends Record<T, string | number | undefined | null | Date | boolean>
>(
	key: T,
	data: U[],
	log = false
) => {
	const targetSet = [...new Set(data.map((item) => item[key]))];

	if (log) {
		logging.info('Target Set : ', targetSet, ' - Length - ', targetSet.length);
	}

	if (targetSet.length === 1) {
		return targetSet[0];
	}
	return undefined;
};

export const load = async (data) => {
	authGuard(data);
	const pageInfo = serverPageInfo(data.route.id, data);

	// logging.info('Loading Data : ', pageInfo);

	const journalInformation = await tActions.journal.list({
		db: db,
		filter: pageInfo.current.searchParams || defaultJournalFilter
	});

	const accountId = getCommonData('accountId', journalInformation.data);
	const amount = getCommonData('amount', journalInformation.data);
	const tagId = getCommonData('tagId', journalInformation.data);
	const categoryId = getCommonData('categoryId', journalInformation.data);
	const billId = getCommonData('billId', journalInformation.data);
	const budgetId = getCommonData('budgetId', journalInformation.data);
	const date = getCommonData('dateText', journalInformation.data);
	const description = getCommonData('description', journalInformation.data);
	const linked = getCommonData('linked', journalInformation.data);
	const reconciled = getCommonData('reconciled', journalInformation.data);
	const complete = getCommonData('complete', journalInformation.data);
	const dataChecked = getCommonData('dataChecked', journalInformation.data);

	const canEdit = complete === false;

	const form = await superValidate(
		{
			accountId,
			amount,
			tagId,
			categoryId,
			billId,
			budgetId,
			date,
			description,
			linked,
			reconciled,
			complete,
			dataChecked
		},
		updateJournalSchema
	);

	const cloneForm = await superValidate(
		{
			accountId,
			amount,
			tagId,
			categoryId,
			billId,
			budgetId,
			date,
			description,
			linked,
			reconciled,
			complete,
			dataChecked
		},
		updateJournalSchema
	);

	return {
		selectedJournals: {
			reconciled,
			complete,
			dataChecked,
			count: journalInformation.data.length,
			canEdit
		},
		journalInformation,
		form,
		cloneForm
	};
};

const pageAndFilterValidation = z.object({
	filter: z.string(),
	prevPage: z
		.string()
		.optional()
		.default(
			urlGenerator({ address: '/(loggedIn)/journals', searchParamsValue: defaultJournalFilter }).url
		),
	currentPage: z
		.string()
		.optional()
		.default(
			urlGenerator({ address: '/(loggedIn)/journals', searchParamsValue: defaultJournalFilter }).url
		)
});
const cloneValidation = updateJournalSchema.merge(pageAndFilterValidation);

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
					urlGenerator({ address: '/(loggedIn)/journals', searchParamsValue: defaultJournalFilter })
						.url
			);
		}

		throw redirect(302, form.data.prevPage);
	},
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
			logging.info('Cloning Journals : ', { filter: parsedFilter.data, journalData: form.data });

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
