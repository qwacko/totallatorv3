import { text } from '@sveltejs/kit';
import type { ServerRouteConfig } from 'skroutes';
import superjson from 'superjson';

import { tActions } from '@totallator/business-logic';
import { defaultJournalFilter, journalFilterSchemaWithoutPagination } from '@totallator/shared';

import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes.server';

export const _routeConfig = {
	searchParamsValidation: journalFilterSchemaWithoutPagination
		.optional()
		.catch(defaultJournalFilter())
} satisfies ServerRouteConfig[string];

export const GET = async (data) => {
	authGuard(data);
	const {
		current: { searchParams }
	} = serverPageInfo(data.route.id, data);

	const summaryData = await tActions.journalView.summary({
		filter: searchParams
	});

	return text(superjson.stringify(summaryData));
};
