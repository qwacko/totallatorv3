import type { CreateJournalSchemaType } from '$lib/schema/journalSchema';
import type { StatusEnumType } from '$lib/schema/statusSchema';
import type { DBType } from '../../../db';
import { accountActions } from '../../accountActions';
import { billActions } from '../../billActions';
import { budgetActions } from '../../budgetActions';
import { categoryActions } from '../../categoryActions';
import { labelActions } from '../../labelActions';
import { tagActions } from '../../tagActions';

export const journalGetOrCreateLinkedItems = async ({
	db,
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
	cachedAccounts?: { id: string; title: string; status: StatusEnumType }[];
	cachedBills?: { id: string; title: string; status: StatusEnumType }[];
	cachedBudgets?: { id: string; title: string; status: StatusEnumType }[];
	cachedTags?: { id: string; title: string; status: StatusEnumType }[];
	cachedCategories?: { id: string; title: string; status: StatusEnumType }[];
	cachedLabels?: { id: string; title: string; status: StatusEnumType }[];
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
		db,
		id: accountId,
		title: accountTitle,
		cachedData: cachedAccounts
	});
	const targetBill = await billActions.createOrGet({
		db,
		id: billId,
		title: billTitle,
		cachedData: cachedBills
	});
	const targetBudget = await budgetActions.createOrGet({
		db,
		id: budgetId,
		title: budgetTitle,
		cachedData: cachedBudgets
	});
	const targetCategory = await categoryActions.createOrGet({
		db,
		id: categoryId,
		title: categoryTitle,
		cachedData: cachedCategories
	});

	const targetTag = await tagActions.createOrGet({
		db,
		id: tagId,
		title: tagTitle,
		cachedData: cachedTags
	});

	const targetLabelIds = labels
		? await Promise.all(
				labels.map(async (label) => {
					return await labelActions.createOrGet({
						db,
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
						db,
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
		labels: targetLabels
	};
};
function filterUndefinedFromArray<T>(arr: (T | undefined)[]): T[] {
	return arr.filter((item): item is Exclude<T, undefined> => item !== undefined);
}
