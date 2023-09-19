import type { CreateCombinedTransactionType } from '$lib/schema/journalSchema';
import { logging } from '$lib/server/logging';
import {
	getRandomArrayElement,
	getRandomBoolean,
	getRandomDate,
	getRandomInteger
} from './getRandom';

export const seedTransactionData = ({
	assetLiabilityIds,
	incomeIds,
	expenseIds,
	billIds,
	budgetIds,
	categoryIds,
	tagIds,
	labelIds
}: {
	assetLiabilityIds: string[];
	incomeIds: string[];
	expenseIds: string[];
	billIds: string[];
	budgetIds: string[];
	categoryIds: string[];
	tagIds: string[];
	labelIds: string[];
}): CreateCombinedTransactionType => {
	const isTransfer = getRandomBoolean(0.3);
	const isIncome = getRandomBoolean(0.5);

	const fromAccountId = getRandomArrayElement(
		isTransfer && isIncome ? incomeIds : assetLiabilityIds
	);
	const toAccountId = getRandomArrayElement(
		isTransfer && !isIncome ? expenseIds : assetLiabilityIds
	);
	const amount = getRandomInteger(100000) / 100;

	const status = getRandomArrayElement(['complete', 'reconciled', 'data', 'nothing']);
	const numberLabels = getRandomBoolean(0.2) ? getRandomInteger(3) : 0;
	const labels = [
		...new Set(
			Array(numberLabels)
				.fill(0)
				.map(() => getRandomArrayElement(labelIds))
		)
	];

	const dateText = getRandomDate(new Date('2010-01-01'), new Date('2025-12-31'))
		.toISOString()
		.slice(0, 10);

	const coreItem: Omit<CreateCombinedTransactionType[number], 'amount' | 'accountId'> = {
		date: dateText,
		description: `${
			isTransfer ? 'Transfer' : isIncome ? 'Deposit' : 'Withdrawl'
		} ${getRandomInteger(1000)}`,
		linked: true,
		complete: status === 'complete',
		reconciled: status === 'reconciled' || status === 'complete',
		dataChecked: status === 'data' || status === 'complete',
		billId: getRandomBoolean(0.1) ? getRandomArrayElement(billIds) : undefined,
		budgetId: getRandomBoolean(0.2) ? getRandomArrayElement(budgetIds) : undefined,
		tagId: getRandomBoolean(0.8) ? getRandomArrayElement(tagIds) : undefined,
		categoryId: getRandomBoolean(0.8) ? getRandomArrayElement(categoryIds) : undefined,
		labels
	};

	const returnItems = [
		{ ...coreItem, amount: -1 * amount, accountId: fromAccountId },
		{ ...coreItem, amount: amount, accountId: toAccountId }
	];

	return returnItems;
};
