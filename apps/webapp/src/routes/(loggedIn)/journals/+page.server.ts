import { redirect } from '@sveltejs/kit';
import type { SingleServerRouteConfig } from 'skroutes';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import * as z from 'zod';

import { tActions } from '@totallator/business-logic';
import { journalFilterArray } from '@totallator/business-logic';
import {
	defaultJournalFilter,
	journalFilterSchema,
	type JournalFilterSchemaType,
	journalFilterSchemaWithoutPagination,
	updateJournalSchema
} from '@totallator/shared';

import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes.server';
import { associatedInfoFormActions } from '$lib/server/associatednfoFormActions.js';
import { fileFormActions } from '$lib/server/fileFormActions';
import { extractAutocompleteFromTextFilter } from '$lib/server/helpers/filterConfigExtractor.js';
import { noteFormActions } from '$lib/server/noteFormActions.js';

export const _routeConfig = {
	searchParamsValidation: journalFilterSchema.optional().catch(defaultJournalFilter())
} satisfies SingleServerRouteConfig;

export const load = async (data) => {
	const startTime = Date.now();
	authGuard(data);
	const { current: pageInfo, updateParams } = serverPageInfo(data.route.id, data);

	const filter: JournalFilterSchemaType = pageInfo.searchParams || {
		page: 0,
		pageSize: 10,
		orderBy: [{ field: 'date', direction: 'desc' }],
		account: { type: ['asset', 'liability'] }
	};

	const { pageSize, page, orderBy, ...searchParamsWithoutPagination } = filter;

	data.locals.global.logger('journals').debug({
		code: 'WEB_JRN_001',
		title: 'Journals page loaded',
		userId: data.locals.user?.id,
		pageSize: filter.pageSize,
		page: filter.page,
		hasFilters: Object.keys(searchParamsWithoutPagination).length > 0
	});

	if (filter.pageSize > 500) {
		data.locals.global.logger('journals').warn({
			code: 'WEB_JRN_002',
			title: 'Journal page size too large - redirecting',
			requestedPageSize: filter.pageSize,
			userId: data.locals.user?.id
		});
		redirect(302, updateParams({ searchParams: { pageSize: 10 } }).url);
	}

	try {
		const latestUpdate = await tActions.journalView.getLatestUpdateDate();

		// Generate autocomplete configuration from server-side filter array
		const autocompleteKeys = extractAutocompleteFromTextFilter(journalFilterArray, 'journal');

		const duration = Date.now() - startTime;
		data.locals.global.logger('journals').debug({
			code: 'WEB_JRN_003',
			title: 'Journals page data loaded successfully',
			userId: data.locals.user?.id,
			duration,
			latestUpdate
		});

		return {
			searchParams: pageInfo.searchParams,
			searchParamsWithoutPagination,
			latestUpdate,
			autocompleteKeys
		};
	} catch (e) {
		const duration = Date.now() - startTime;
		data.locals.global.logger('journals').error({
			code: 'WEB_JRN_004',
			title: 'Failed to load journals page data',
			userId: data.locals.user?.id,
			duration,
			error: e
		});
		throw e;
	}
};

export const actions = {
	...noteFormActions,
	...fileFormActions,
	...associatedInfoFormActions,
	updateJournal: async (data) => {
		const startTime = Date.now();
		const form = await superValidate(
			data.request,
			zod4(
				z.object({
					...updateJournalSchema.shape,
					filter: journalFilterSchemaWithoutPagination
				})
			)
		);

		if (!form.valid) {
			data.locals.global.logger('journals').warn({
				code: 'WEB_JRN_010',
				title: 'Journal update form validation failed',
				userId: data.locals.user?.id,
				validationErrors: form.errors
			});
			return { form };
		}

		const parsedFilter = journalFilterSchema.safeParse(form.data.filter);

		if (!parsedFilter.success) {
			data.locals.global.logger('journals').warn({
				code: 'WEB_JRN_011',
				title: 'Journal update filter parsing failed',
				userId: data.locals.user?.id,
				filterParseError: parsedFilter.error
			});
			return { form };
		}

		const { filter, ...journalData } = form.data;
		data.locals.global.logger('journals').info({
			code: 'WEB_JRN_012',
			title: 'Journal bulk update initiated',
			userId: data.locals.user?.id,
			filter: parsedFilter.data,
			updateFields: Object.keys(journalData)
		});

		try {
			await tActions.journal.updateJournals({
				filter: parsedFilter.data,
				journalData: form.data
			});

			const duration = Date.now() - startTime;
			data.locals.global.logger('journals').info({
				code: 'WEB_JRN_013',
				title: 'Journal bulk update completed successfully',
				userId: data.locals.user?.id,
				filter: parsedFilter.data,
				updateFields: Object.keys(journalData),
				duration
			});
		} catch (e) {
			const duration = Date.now() - startTime;
			data.locals.global.logger('journals').error({
				code: 'WEB_JRN_014',
				title: 'Journal bulk update failed',
				userId: data.locals.user?.id,
				filter: parsedFilter.data,
				updateFields: Object.keys(journalData),
				duration,
				error: e
			});

			return message(form, 'Error Updating Journals');
		}

		return { form };
	},

	update: async (data) => {
		const startTime = Date.now();
		const form = await data.request.formData();
		const journalId = form.get('journalId')?.toString();
		const action = form.get('action')?.toString();

		if (!journalId || !action) {
			data.locals.global.logger('journals').warn({
				code: 'WEB_JRN_020',
				title: 'Journal update called without required parameters',
				userId: data.locals.user?.id,
				journalId,
				action
			});
			return;
		}

		data.locals.global.logger('journals').debug({
			code: 'WEB_JRN_021',
			title: 'Individual journal update initiated',
			userId: data.locals.user?.id,
			journalId,
			action
		});

		try {
			if (action === 'uncomplete') {
				await tActions.journal.markUncomplete(journalId);
			} else if (action === 'complete') {
				await tActions.journal.markComplete(journalId);
			} else if (action === 'reconcile') {
				await tActions.journal.updateJournals({
					filter: { id: journalId },
					journalData: { setReconciled: true }
				});
			} else if (action === 'unreconcile') {
				await tActions.journal.updateJournals({
					filter: { id: journalId },
					journalData: { clearReconciled: true }
				});
			} else if (action === 'check') {
				await tActions.journal.updateJournals({
					filter: { id: journalId },
					journalData: { setDataChecked: true }
				});
			} else if (action === 'uncheck') {
				await tActions.journal.updateJournals({
					filter: { id: journalId },
					journalData: { clearDataChecked: true }
				});
			}

			const duration = Date.now() - startTime;
			data.locals.global.logger('journals').info({
				code: 'WEB_JRN_022',
				title: 'Individual journal update completed successfully',
				userId: data.locals.user?.id,
				journalId,
				action,
				duration
			});

			return;
		} catch (error) {
			const duration = Date.now() - startTime;
			data.locals.global.logger('journals').error({
				code: 'WEB_JRN_023',
				title: 'Individual journal update failed',
				userId: data.locals.user?.id,
				journalId,
				action,
				duration,
				error
			});
			return;
		}
	}
};
