import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import type { JournalFilterSchemaType } from '$lib/schema/journalSchema.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';

export const load = async (data) => {
	authGuard(data);
	const { current: pageInfo } = serverPageInfo(data.route.id, data);

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

	const tags = tActions.tag.listForDropdown({ db });
	const bills = tActions.bill.listForDropdown({ db });
	const budgets = tActions.budget.listForDropdown({ db });
	const categories = tActions.category.listForDropdown({ db });
	const labels = tActions.label.listForDropdown({ db });
	const accounts = tActions.account.listForDropdown({ db });

	return {
		journals: journalData,
		dropdownInfo: { tags, bills, budgets, categories, labels, accounts }
	};
};
