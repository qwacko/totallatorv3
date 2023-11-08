import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import type { JournalFilterSchemaType } from '$lib/schema/journalSchema.js';
import { journalFilterToText } from '$lib/server/db/actions/helpers/journalFilterToQuery.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';
import { redirect } from '@sveltejs/kit';

export const load = async (data) => {
	authGuard(data);
	const { current: pageInfo, updateParams } = serverPageInfo(data.route.id, data);

	const filter: JournalFilterSchemaType = pageInfo.searchParams || {
		page: 0,
		pageSize: 10,
		orderBy: [{ field: 'date', direction: 'desc' }],
		account: { type: ['asset', 'liability'] }
	};

	const journalData = await tActions.journal.list({
		db,
		filter
	});

	if (journalData.page >= journalData.pageCount) {
		const targetPage = Math.max(0, journalData.pageCount - 1);
		throw redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
	}

	const summary = tActions.journal.summary({
		db,
		filter: { ...filter, page: 0, pageSize: 1000000 }
	});

	const tags = tActions.tag.listForDropdown({ db });
	const bills = tActions.bill.listForDropdown({ db });
	const budgets = tActions.budget.listForDropdown({ db });
	const categories = tActions.category.listForDropdown({ db });
	const labels = tActions.label.listForDropdown({ db });
	const accounts = tActions.account.listForDropdown({ db });

	return {
		journals: journalData,
		summary,
		dropdownInfo: { tags, bills, budgets, categories, labels, accounts },
		filterText: journalFilterToText(filter, { prefix: 'Journal' }),
		filterDropdown: tActions.reusableFitler.listForDropdown({ db })
	};
};
