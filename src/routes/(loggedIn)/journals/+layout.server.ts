import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import type { JournalFilterSchemaType } from '$lib/schema/journalSchema.js';
import { bufferingHelper } from '$lib/server/bufferingHelper.js';
import { journalFilterToText } from '$lib/server/db/actions/helpers/journal/journalFilterToQuery.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';
import { dropdownItems } from '$lib/server/dropdownItems.js';
import { redirect } from '@sveltejs/kit';

export const load = async (data) => {
	authGuard(data);
	const { current: pageInfo, updateParams } = serverPageInfo(data.route.id, data);
	bufferingHelper(data);

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
		redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
	}

	const summary = tActions.journal.summary({
		db,
		filter: { ...filter, page: 0, pageSize: 1000000 }
	});

	const dropdownInfo = dropdownItems({ db });

	return {
		journals: journalData,
		streamed: {
			summary,
			dropdownInfo
		},
		filterText: journalFilterToText({ db, filter, prefix: 'Journal' }),
		filterDropdown: tActions.reusableFitler.listForDropdown({ db })
	};
};
