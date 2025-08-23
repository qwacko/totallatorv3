import type { SingleServerRouteConfig } from 'skroutes';

import { importFilterToText } from '@totallator/business-logic';
import { tActions } from '@totallator/business-logic';
import { importFilterSchema } from '@totallator/shared';

import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes.server';

export const load = async (data) => {
	const startTime = Date.now();
	authGuard(data);
	const db = data.locals.db;
	const { current } = serverPageInfo(data.route.id, data);

	const searchParams = current.searchParams || {};

	data.locals.global.logger('imports').debug({
		code: 'WEB_IMP_001',
		title: 'Import page loaded',
		userId: data.locals.user?.id,
		searchParams,
		hasFilters: Object.keys(searchParams).length > 0
	});

	try {
		const imports = await tActions.import.list({ filter: searchParams });
		const filterText = await importFilterToText({ db, filter: searchParams });
		const needsRefresh = (await tActions.import.numberActive()) > 0;

		const duration = Date.now() - startTime;
		data.locals.global.logger('imports').debug({
			code: 'WEB_IMP_002',
			title: 'Import page data loaded successfully',
			userId: data.locals.user?.id,
			importCount: imports.data.length,
			totalImports: imports.count,
			needsRefresh,
			duration
		});

		return {
			imports,
			searchParams,
			filterText,
			needsRefresh
		};
	} catch (e) {
		const duration = Date.now() - startTime;
		data.locals.global.logger('imports').error({
			code: 'WEB_IMP_003',
			title: 'Failed to load import page data',
			userId: data.locals.user?.id,
			searchParams,
			duration,
			error: e
		});
		throw e;
	}
};

export const _routeConfig = {
	searchParamsValidation: importFilterSchema.optional().catch({})
} satisfies SingleServerRouteConfig;
