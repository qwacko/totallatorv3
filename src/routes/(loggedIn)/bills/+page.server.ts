import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import { defaultJournalFilter } from '$lib/schema/journalSchema';
import { billFilterToText } from '$lib/server/db/actions/helpers/billFilterToQuery.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';
import { redirect } from '@sveltejs/kit';

export const load = async (data) => {
	authGuard(data);
	const { current: pageInfo, updateParams } = serverPageInfo(data.route.id, data);

	const bills = await tActions.bill.list({
		db,
		filter: pageInfo.searchParams || { page: 0, pageSize: 10 }
	});
	const redirectRequired = bills.page >= bills.pageCount;
	if (redirectRequired) {
		const targetPage = Math.max(0, bills.pageCount - 1);
		throw redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
	}

	const billSummary = tActions.journal.summary({
		db,
		filter: { ...defaultJournalFilter(), bill: pageInfo.searchParams }
	});

	return {
		bills,
		searchParams: pageInfo.searchParams,
		filterText: billFilterToText(pageInfo.searchParams || { page: 0, pageSize: 10 }),
		billSummary
	};
};
