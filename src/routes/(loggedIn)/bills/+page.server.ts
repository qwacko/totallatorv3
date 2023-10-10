import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import { defaultAllJournalFilter } from '$lib/schema/journalSchema.js';
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

	const billIds = bills.data.map((item) => item.id);
	const journalCount = Promise.all(
		billIds.map(async (billId) => {
			const count = await tActions.journal.count(db, {
				...defaultAllJournalFilter,
				bill: { id: billId },
				account: { type: ['asset', 'liability'] }
			});

			return { id: billId, count };
		})
	);
	const journalSum = Promise.all(
		billIds.map(async (billId) => {
			const sum = await tActions.journal.sum(db, {
				...defaultAllJournalFilter,
				bill: { id: billId },
				account: { type: ['asset', 'liability'] }
			});

			return { id: billId, sum };
		})
	);

	return {
		bills,
		searchParams: pageInfo.searchParams,
		filterText: billFilterToText(pageInfo.searchParams || { page: 0, pageSize: 10 }),
		deferred: {
			journalCount,
			journalSum
		}
	};
};
