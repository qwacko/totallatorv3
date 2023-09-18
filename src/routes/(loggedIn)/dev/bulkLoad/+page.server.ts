import { tActions } from '$lib/server/db/actions/tActions.js';
import { db } from '$lib/server/db/db';
import { logging } from '$lib/server/logging.js';

export const load = async () => {
	const accountCount = tActions.account.count(db);
	const accountsWithJournalCount = await tActions.account.listWithTransactionCount(db);
	const deletableAccountCount = accountsWithJournalCount.filter(
		(item) => item.journalCount === 0
	).length;
	const accountCreationOptions = [
		{ title: '+ 10', income: 3, expense: 3, asset: 3, liability: 1 },
		{ title: '+ 40', income: 6, expense: 20, asset: 10, liability: 4 },
		{ title: '+ 100', income: 15, expense: 50, asset: 20, liability: 15 }
	];

	return {
		accountCreationOptions,
		accountCount,
		deletableAccountCount
	};
};

export const actions = {
	bulkAddAccounts: async (data) => {
		try {
			const form = await data.request.formData();
			logging.info('Form Data : ', form.entries.toString());
			const countIncome = Number(form.get('countIncome')?.toString() || '10');
			const countExpenses = Number(form.get('countExpenses')?.toString() || '10');
			const countAssets = Number(form.get('countAssets')?.toString() || '10');
			const countLiabilities = Number(form.get('countLiabilities')?.toString() || '10');

			await tActions.account.seed(db, {
				countAssets,
				countExpenses,
				countIncome,
				countLiabilities
			});
		} catch (e) {
			logging.error('Error Creating Bulk Accounts : ', e);
		}
	},
	deleteUnusedAccounts: async () => {
		try {
			const accountsWithJournalCount = await tActions.account.listWithTransactionCount(db);
			const items = accountsWithJournalCount.filter((item) => item.journalCount === 0);
			await tActions.account.deleteMany(db, items);
		} catch (e) {
			logging.error('Error Deleting Unused Accounts : ', e);
		}
	}
};
