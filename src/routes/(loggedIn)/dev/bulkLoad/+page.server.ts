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

	const billCount = tActions.bill.count(db);
	const billsWithJournalCount = await tActions.bill.listWithTransactionCount(db);
	const deletableBillCount = billsWithJournalCount.filter((item) => item.journalCount === 0).length;

	const budgetCount = tActions.budget.count(db);
	const budgetsWithJournalCount = await tActions.budget.listWithTransactionCount(db);
	const deletableBudgetCount = budgetsWithJournalCount.filter(
		(item) => item.journalCount === 0
	).length;

	const categoryCount = tActions.category.count(db);
	const categoriesWithJournalCount = await tActions.category.listWithTransactionCount(db);
	const deletableCategoryCount = categoriesWithJournalCount.filter(
		(item) => item.journalCount === 0
	).length;

	const tagCount = tActions.tag.count(db);
	const tagsWithJournalCount = await tActions.tag.listWithTransactionCount(db);
	const deletableTagCount = tagsWithJournalCount.filter((item) => item.journalCount === 0).length;

	const labelCount = tActions.label.count(db);
	const labelsWithJournalCount = await tActions.label.listWithTransactionCount(db);
	const deletableLabelCount = labelsWithJournalCount.filter(
		(item) => item.journalCount === 0
	).length;

	return {
		accountCreationOptions,
		accountCount,
		deletableAccountCount,

		billCount,
		deletableBillCount,

		budgetCount,
		deletableBudgetCount,

		categoryCount,
		deletableCategoryCount,

		tagCount,
		deletableTagCount,

		labelCount,
		deletableLabelCount
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
	bulkAddTags: async (data) => {
		try {
			const form = await data.request.formData();
			const count = Number(form.get('count')?.toString() || '10');

			await tActions.tag.seed(db, count);
		} catch (e) {
			logging.error('Error Creating Bulk Tags : ', e);
		}
	},
	bulkAddBills: async (data) => {
		try {
			const form = await data.request.formData();
			const count = Number(form.get('count')?.toString() || '10');

			await tActions.bill.seed(db, count);
		} catch (e) {
			logging.error('Error Creating Bulk Bills : ', e);
		}
	},
	bulkAddBudgets: async (data) => {
		try {
			const form = await data.request.formData();
			const count = Number(form.get('count')?.toString() || '10');

			await tActions.budget.seed(db, count);
		} catch (e) {
			logging.error('Error Creating Budget Tags : ', e);
		}
	},
	bulkAddCategories: async (data) => {
		try {
			const form = await data.request.formData();
			const count = Number(form.get('count')?.toString() || '10');

			await tActions.category.seed(db, count);
		} catch (e) {
			logging.error('Error Creating Bulk Categories : ', e);
		}
	},
	bulkAddLabels: async (data) => {
		try {
			const form = await data.request.formData();
			const count = Number(form.get('count')?.toString() || '10');

			await tActions.label.seed(db, count);
		} catch (e) {
			logging.error('Error Creating Bulk Labels : ', e);
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
	},
	deleteUnusedTags: async () => {
		try {
			const tagsWithJournalCount = await tActions.tag.listWithTransactionCount(db);
			const items = tagsWithJournalCount.filter((item) => item.journalCount === 0);
			await tActions.tag.deleteMany(db, items);
		} catch (e) {
			logging.error('Error Deleting Unused Tags : ', e);
		}
	},
	deleteUnusedCategories: async () => {
		try {
			const categoriesWithJournalCount = await tActions.category.listWithTransactionCount(db);
			const items = categoriesWithJournalCount.filter((item) => item.journalCount === 0);
			await tActions.category.deleteMany(db, items);
		} catch (e) {
			logging.error('Error Deleting Unused Categories : ', e);
		}
	},
	deleteUnusedBills: async () => {
		try {
			const billsWithJournalCount = await tActions.bill.listWithTransactionCount(db);
			const items = billsWithJournalCount.filter((item) => item.journalCount === 0);
			await tActions.bill.deleteMany(db, items);
		} catch (e) {
			logging.error('Error Deleting Unused Bills : ', e);
		}
	},
	deleteUnusedBudgets: async () => {
		try {
			const budgetsWithJournalCount = await tActions.budget.listWithTransactionCount(db);
			const items = budgetsWithJournalCount.filter((item) => item.journalCount === 0);
			await tActions.budget.deleteMany(db, items);
		} catch (e) {
			logging.error('Error Deleting Unused Budgets : ', e);
		}
	},
	deleteUnusedLabels: async () => {
		try {
			const labelsWithJournalCount = await tActions.label.listWithTransactionCount(db);
			const items = labelsWithJournalCount.filter((item) => item.journalCount === 0);
			await tActions.label.hardDeleteMany(db, items);
		} catch (e) {
			logging.error('Error Deleting Unused Labels : ', e);
		}
	}
};
