import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import type { JournalFilterSchemaType } from '$lib/schema/journalSchema.js';
import { bufferingHelper } from '$lib/server/bufferingHelper.js';
import { journalFilterToText } from '$lib/server/db/actions/helpers/journal/journalFilterToQuery.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { redirect } from '@sveltejs/kit';

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;
	const { current: pageInfo, updateParams } = serverPageInfo(data.route.id, data);
	bufferingHelper(data);

	const filter: JournalFilterSchemaType = pageInfo.searchParams || {
		page: 0,
		pageSize: 10,
		orderBy: [{ field: 'date', direction: 'desc' }],
		account: { type: ['asset', 'liability'] }
	};

	const journalData = await tActions.journalView.list({
		db,
		filter,
		disableRefresh: true
	});

	if (journalData.page >= journalData.pageCount) {
		const targetPage = Math.max(0, journalData.pageCount - 1);
		redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
	}

	const filterText = await journalFilterToText({ db, filter, prefix: 'Journal' });
	const filterDropdown = await tActions.reusableFitler.listForDropdown({ db });

	return {
		journals: journalData,
		filterText,
		filterDropdown
	};
};
