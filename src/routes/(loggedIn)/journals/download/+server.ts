import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import type { CreateSimpleTransactionType } from '$lib/schema/journalSchema.js';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { db } from '$lib/server/db/db';

import Papa from 'papaparse';
import { filterNullUndefinedAndDuplicates } from '../filterNullUndefinedAndDuplicates.js';

export const GET = async (data) => {
	authGuard(data);
	const {
		current: { searchParams }
	} = serverPageInfo(data.route.id, data);

	const journalData = await tActions.journal.list({
		db,
		filter: { ...searchParams, page: 0, pageSize: 100000 }
	});

	const transactionIds = filterNullUndefinedAndDuplicates(
		journalData.data.map((item) => item.transactionId)
	);
	const journalDataToUse =
		searchParams?.downloadType === 'import'
			? filterNullUndefinedAndDuplicates(
					transactionIds.map((currentTransactionId) =>
						journalData.data.find((item) => item.transactionId === currentTransactionId)
					)
			  )
			: journalData.data;

	const preppedData = journalDataToUse.map((item, row) => {
		if (searchParams?.downloadType === 'import') {
			const fromAccountTitle =
				item.amount > 0 ? item.otherJournals[0].accountTitle : item.accountTitle;
			const toAccountTitle =
				item.amount <= 0 ? item.otherJournals[0].accountTitle : item.accountTitle;
			const amount = item.amount > 0 ? item.amount : -1 * item.amount;

			return {
				date: item.date.toString().slice(0, 10),
				fromAccountTitle: fromAccountTitle || undefined,
				toAccountTitle: toAccountTitle || undefined,
				amount,
				description: item.description,
				billTitle: item.billTitle || undefined,
				budgetTitle: item.budgetTitle || undefined,
				categoryTitle: item.categoryTitle || undefined,
				tagTitle: item.categoryTitle || undefined,
				complete: item.complete,
				dataChecked: item.dataChecked,
				reconciled: item.reconciled
			} satisfies CreateSimpleTransactionType;
		}
		return {
			row,
			transactionId: item.transactionId,
			date: item.date,
			description: item.description,
			amount: item.amount,
			total: item.total,
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
