import type { CreateJournalSchemaType } from '@totallator/shared';
import type { DBType } from '@totallator/database';
import { accountActions } from '../../accountActions';
import { billActions } from '../../billActions';
import { budgetActions } from '../../budgetActions';
import { categoryActions } from '../../categoryActions';
import { labelActions } from '../../labelActions';
import { tagActions } from '../../tagActions';
import type { CreateOrGetType } from '../misc/createOrGetType';

export const journalGetOrCreateLinkedItems = async ({
	journalEntry,
	cachedAccounts,
	cachedBills,
	cachedBudgets,
	cachedCategories,
	cachedLabels,
	cachedTags
}: {
	db: DBType;
	journalEntry: CreateJournalSchemaType;
	cachedAccounts?: CreateOrGetType[];
	cachedBills?: CreateOrGetType[];
	cachedBudgets?: CreateOrGetType[];
	cachedTags?: CreateOrGetType[];
	cachedCategories?: CreateOrGetType[];
	cachedLabels?: CreateOrGetType[];
}) => {
	const {
		categoryId,
		categoryTitle,
		accountId,
		accountTitle,
		billId,
		billTitle,
		budgetId,
		budgetTitle,
		tagId,
		tagTitle,
		labels,
		labelTitles,
		...restJournalData
	} = journalEntry;
	const targetAccount = await accountActions.createOrGet({
		id: accountId,
		title: accountTitle,
		cachedData: cachedAccounts
	});
	const targetBill = await billActions.createOrGet({
		id: billId,
		title: billTitle,
		cachedData: cachedBills
	});
	const targetBudget = await budgetActions.createOrGet({
		id: budgetId,
		title: budgetTitle,
		cachedData: cachedBudgets
	});
	const targetCategory = await categoryActions.createOrGet({
		id: categoryId,
		title: categoryTitle,
		cachedData: cachedCategories
	});

	const targetTag = await tagActions.createOrGet({
		id: tagId,
		title: tagTitle,
		cachedData: cachedTags
	});

	const targetLabelIds = labels
		? await Promise.all(
				labels.map(async (label) => {
					return await labelActions.createOrGet({
						id: label,
						cachedData: cachedLabels
					});
				})
			)
		: [];

	const targetLabelTitles = labelTitles
		? await Promise.all(
				labelTitles.map(async (labelTitle) => {
					return await labelActions.createOrGet({
						title: labelTitle,
						cachedData: cachedLabels
					});
				})
			)
		: [];

	const targetLabels = filterUndefinedFromArray([...targetLabelIds, ...targetLabelTitles]);

	return {
		...restJournalData,
		accountId: targetAccount?.id,
		billId: targetBill?.id,
		budgetId: targetBudget?.id,
		categoryId: targetCategory?.id,
		tagId: targetTag?.id,
		labels: targetLabels.filter((item) => item !== null).map((item) => item?.id || '')
	};
};
function filterUndefinedFromArray<T>(arr: (T | undefined)[]): T[] {
	return arr.filter((item): item is Exclude<T, undefined> => item !== undefined);
}
