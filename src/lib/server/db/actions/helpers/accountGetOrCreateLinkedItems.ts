import type { DBType } from '../../db';
import { accountActions } from '../accountActions';
import { billActions } from '../billActions';
import { budgetActions } from '../budgetActions';
import { categoryActions } from '../categoryActions';
import { labelActions } from '../labelActions';
import { tagActions } from '../tagActions';

export const accountGetOrCreateLinkedItems = async (
	db: DBType,
	journalEntry: {
		categoryId?: string;
		categoryTitle?: string;
		accountId?: string;
		accountTitle?: string;
		billId?: string;
		billTitle?: string;
		budgetId?: string;
		budgetTitle?: string;
		tagId?: string;
		tagTitle?: string;
		labels?: string[];
		labelTitles?: string[];
	}
) => {
	const targetAccount = await accountActions.createOrGet({
		db,
		id: journalEntry.accountId,
		title: journalEntry.accountTitle
	});
	const targetBill = await billActions.createOrGet({
		db,
		id: journalEntry.billId,
		title: journalEntry.billTitle
	});
	const targetBudget = await budgetActions.createOrGet({
		db,
		id: journalEntry.budgetId,
		title: journalEntry.budgetTitle
	});
	const targetCategory = await categoryActions.createOrGet({
		db,
		id: journalEntry.categoryId,
		title: journalEntry.categoryTitle
	});

	const targetTag = await tagActions.createOrGet({
		db,
		id: journalEntry.tagId,
		title: journalEntry.tagTitle
	});
	const targetLabelIds = journalEntry.labels
		? await Promise.all(
				journalEntry.labels.map(async (label) => {
					return await labelActions.createOrGet({
						db,
						id: label
					});
				})
		  )
		: [];
	const targetLabelTitles = journalEntry.labelTitles
		? await Promise.all(
				journalEntry.labelTitles.map(async (labelTitle) => {
					return await labelActions.createOrGet({
						db,
						title: labelTitle
					});
				})
		  )
		: [];

	const targetLabels = filterUndefinedFromArray([...targetLabelIds, ...targetLabelTitles]);

	return {
		accountId: targetAccount?.id,
		billId: targetBill?.id,
		budgetId: targetBudget?.id,
		categoryId: targetCategory?.id,
		tagId: targetTag?.id,
		labelIds: targetLabels.map((label) => label.id)
	};
};
function filterUndefinedFromArray<T>(arr: (T | undefined)[]): T[] {
	return arr.filter((item): item is Exclude<T, undefined> => item !== undefined);
}
