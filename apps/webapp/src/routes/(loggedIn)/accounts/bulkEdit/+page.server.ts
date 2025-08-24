import { redirect } from '@sveltejs/kit';
import type { SingleServerRouteConfig } from 'skroutes';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import * as z from 'zod';

import { tActions } from '@totallator/business-logic';
import { accountFilterToText } from '@totallator/business-logic';
import { accountFilterSchema, updateAccountSchema } from '@totallator/shared';

import { authGuard } from '$lib/authGuard/authGuardConfig';
import { accountPageAndFilterValidation } from '$lib/pageAndFilterValidation.js';
import { serverPageInfo, urlGeneratorServer as urlGenerator } from '$lib/routes.server';

export const load = async (data) => {
	const startTime = Date.now();
	authGuard(data);
	const db = data.locals.db;
	const pageInfo = serverPageInfo(data.route.id, data);

	const filter = pageInfo.current.searchParams;

	data.locals.global.logger('accounts').debug({
		code: 'WEB_ACC_030',
		title: 'Account bulk edit page loaded',
		userId: data.locals.user?.id,
		filter: filter ? Object.keys(filter) : null
	});

	if (!filter) {
		data.locals.global.logger('accounts').warn({
			code: 'WEB_ACC_031',
			title: 'Account bulk edit accessed without filter - redirecting',
			userId: data.locals.user?.id
		});
		redirect(302, '/accounts');
	}

	try {
		const commonData = await tActions.account.listCommonProperties({
			filter
		});
		const accounts = await tActions.account.list({ filter });

		if (!commonData) {
			data.locals.global.logger('accounts').warn({
				code: 'WEB_ACC_032',
				title: 'No common account data found for bulk edit - redirecting',
				userId: data.locals.user?.id,
				filter
			});
			redirect(302, '/accounts');
		}

		const form = await superValidate(commonData, zod4(updateAccountSchema));
		const filterText = await accountFilterToText({ filter, db });

		const titles = accounts.data.map((item) => item.title);
		const numberItems = accounts.count;

		const duration = Date.now() - startTime;
		data.locals.global.logger('accounts').debug({
			code: 'WEB_ACC_033',
			title: 'Account bulk edit data loaded successfully',
			userId: data.locals.user?.id,
			accountCount: numberItems,
			duration
		});

		return {
			idArray: filter,
			form,
			titles,
			filterText,
			numberItems
		};
	} catch (e) {
		const duration = Date.now() - startTime;
		data.locals.global.logger('accounts').error({
			code: 'WEB_ACC_034',
			title: 'Failed to load account bulk edit data',
			userId: data.locals.user?.id,
			filter,
			duration,
			error: e
		});
		throw e;
	}
};

const submitValidation = z.object({
	...updateAccountSchema.shape,
	...accountPageAndFilterValidation.shape
});

export const actions = {
	default: async ({ request, locals }) => {
		const startTime = Date.now();
		const form = await superValidate(request, zod4(submitValidation));

		if (!form.valid) {
			locals.global.logger('accounts').warn({
				code: 'WEB_ACC_040',
				title: 'Account bulk edit form validation failed',
				userId: locals.user?.id,
				validationErrors: form.errors
			});
			redirect(302, form.data.currentPage);
		}

		const parsedFilter = accountFilterSchema.safeParse(JSON.parse(form.data.filter));

		if (!parsedFilter.success) {
			locals.global.logger('accounts').warn({
				code: 'WEB_ACC_041',
				title: 'Account bulk edit filter parsing failed',
				userId: locals.user?.id,
				filterParseError: parsedFilter.error
			});
			redirect(302, form.data.currentPage);
		}

		const { currentPage, prevPage, filter, ...restData } = form.data;
		locals.global.logger('accounts').info({
			code: 'WEB_ACC_042',
			title: 'Account bulk edit initiated',
			userId: locals.user?.id,
			filter: parsedFilter.data,
			updateData: restData
		});

		try {
			await tActions.account.updateMany({
				filter: parsedFilter.data,
				data: restData
			});

			const duration = Date.now() - startTime;
			locals.global.logger('accounts').info({
				code: 'WEB_ACC_043',
				title: 'Account bulk edit completed successfully',
				userId: locals.user?.id,
				filter: parsedFilter.data,
				updateData: restData,
				duration
			});
		} catch (e) {
			const duration = Date.now() - startTime;
			locals.global.logger('accounts').error({
				code: 'WEB_ACC_044',
				title: 'Account bulk edit failed',
				userId: locals.user?.id,
				filter: parsedFilter.data,
				updateData: restData,
				duration,
				error: e
			});
			redirect(
				302,
				form.data.prevPage ||
					urlGenerator({
						address: '/(loggedIn)/accounts',
						searchParamsValue: {}
					}).url
			);
		}

		redirect(302, form.data.prevPage);
	}
};

export const _routeConfig = {
	searchParamsValidation: accountFilterSchema.catch({})
} satisfies SingleServerRouteConfig;
