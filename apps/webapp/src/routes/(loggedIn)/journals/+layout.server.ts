import { redirect } from '@sveltejs/kit';

import { tActions, tHelpers } from '@totallator/business-logic';
import type { EnhancedRecommendationType } from '@totallator/business-logic';
import type { JournalFilterSchemaType } from '@totallator/shared';

import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes.server';
import { bufferingHelper } from '$lib/server/bufferingHelper.js';

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

	const journalData = await tActions.journalView.list({ filter });

	if (journalData.page >= journalData.pageCount) {
		const targetPage = Math.max(0, journalData.pageCount - 1);
		redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
	}

	const journalRecommendations = journalData.data.reduce<
		Record<string, Promise<EnhancedRecommendationType[] | undefined>>
	>((acc, journal) => {
		acc[journal.id] = tActions.journalView.listCombinedRecommendations({
			db,
			journals: [journal],
			includeLlmSuggestions: true
		});
		return acc;
	}, {});

	const filterText = await tHelpers.journal.filterToText({
		db,
		filter,
		prefix: 'Journal'
	});
	const filterDropdown = await tActions.reusableFilter.listForDropdown();

	return {
		journals: journalData,
		filterText,
		filterDropdown,
		journalRecommendations
	};
};
