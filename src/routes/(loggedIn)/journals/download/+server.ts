import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { db } from '$lib/server/db/db';

import Papa from 'papaparse';

export const GET = async (data) => {
	authGuard(data);
	const {
		current: { searchParams }
	} = serverPageInfo(data.route.id, data);

	const journalData = await tActions.journal.list({
		db,
		filter: { ...searchParams, page: 0, pageSize: 100000 }
	});

	const preppedData = journalData.data.map((item, row) => {
		return {
			row,
			transactionId: item.transactionId,
			date: item.date,
			description: item.description,
			amount: item.amount,
			accountTitle: item.accountTitle,
			payeeTitle: item.otherJournals[0].accountTitle,
			billTitle: item.billTitle,
			budgetTitle: item.budgetTitle,
			categoryTitle: item.categoryTitle,
			tagTitle: item.tagTitle,
			importTitle: item.importTitle
		};
	});

	const csvData = Papa.unparse(preppedData);

	const dateText = new Date().toISOString().slice(0, 19);

	return new Response(csvData, {
		headers: {
			'Content-Type': 'text/csv',
			'Content-Disposition': `attachement; filename=${dateText}-journalExport.csv`
		}
	});
};
