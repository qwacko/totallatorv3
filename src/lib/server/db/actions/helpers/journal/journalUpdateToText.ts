import type { UpdateJournalSchemaType } from '$lib/schema/journalSchema';
import { accountIdToTitle } from '../account/accountFilterToQuery';
import { labelIdsToTitle } from '../label/labelFilterToQuery';
import { billIdToTitle } from '../bill/billFilterToQuery';
import { budgetIdToTitle } from '../budget/budgetFilterToQuery';
import { categoryIdToTitle } from '../category/categoryFilterToQuery';
import { tagIdToTitle } from '../tag/tagFilterToQuery';
import type { DBType } from '../../../db';

export const journalUpdateToText = async ({
	db,
	change
}: {
	db: DBType;
	change: UpdateJournalSchemaType | undefined;
}) => {
	if (!change) {
		return undefined;
	}

	const messages: string[] = [];

	//Journal Information
	if (change.amount) messages.push(`Amount: ${change.amount}`);
	if (change.date) messages.push(`Date: ${change.date}`);
	if (change.accountTitle) messages.push(`Account Title: ${change.accountTitle}`);
	if (change.setComplete === true) messages.push(`Set Complete`);
	if (change.clearComplete === true) messages.push(`Clear Complete`);
	if (change.setDataChecked === true) messages.push(`Set Data Checked`);
	if (change.clearDataChecked === true) messages.push(`Clear Data Checked`);
	if (change.setReconciled === true) messages.push(`Set Reconciled`);
	if (change.clearReconciled === true) messages.push(`Clear Reconciled`);
	if (change.setLinked === true) messages.push(`Set Linked`);
	if (change.clearLinked === true) messages.push(`Clear Linked`);
	if (change.description) messages.push(`Description: ${change.description}`);
	//Account
	if (change.accountId) messages.push(`Account: ${await accountIdToTitle(db, change.accountId)}`);
	if (change.accountTitle) messages.push(`Account Title: ${change.accountTitle}`);
	if (change.otherAccountId)
		messages.push(`Other Account: ${await accountIdToTitle(db, change.otherAccountId)}`);
	if (change.otherAccountTitle) messages.push(`Other Account Title: ${change.otherAccountTitle}`);

	//Budget
	if (change.budgetClear) messages.push(`Budget Clear: ${change.budgetClear}`);
	if (change.budgetId) messages.push(`Budget: ${await budgetIdToTitle(db, change.budgetId)}`);
	if (change.budgetTitle) messages.push(`Budget Title: ${change.budgetTitle}`);

	//Category
	if (change.categoryClear) messages.push(`Category Clear: ${change.categoryClear}`);
	if (change.categoryId)
		messages.push(`Category: ${await categoryIdToTitle(db, change.categoryId)}`);
	if (change.categoryTitle) messages.push(`Category Title: ${change.categoryTitle}`);

	//Bills
	if (change.billClear) messages.push(`Bill Clear: ${change.billClear}`);
	if (change.billId) messages.push(`Bill: ${await billIdToTitle(db, change.billId)}`);
	if (change.billTitle) messages.push(`Bill Title: ${change.billTitle}`);

	//Tags
	if (change.tagClear) messages.push(`Tag Clear: ${change.tagClear}`);
	if (change.tagId) messages.push(`Tag: ${await tagIdToTitle(db, change.tagId)}`);
	if (change.tagTitle) messages.push(`Tag Title: ${change.tagTitle}`);

	//Labels
	if (change.clearLabels) messages.push(`Clear Labels`);
	if (change.labelTitles && change.labelTitles.length > 0) {
		messages.push(`Set Labels: ${change.labelTitles.join(', ')}`);
	}
	if (change.labels && change.labels.length > 0) {
		messages.push(`Set Labels: ${(await labelIdsToTitle(db, change.labels)).join(', ')}`);
	}
	if (change.addLabelTitles && change.addLabelTitles.length > 0) {
		messages.push(`Add Labels: ${change.addLabelTitles.join(', ')}`);
	}
	if (change.addLabels && change.addLabels.length > 0) {
		messages.push(`Add Labels: ${(await labelIdsToTitle(db, change.addLabels)).join(', ')}`);
	}
	if (change.removeLabels && change.removeLabels.length > 0) {
		messages.push(`Remove Labels: ${(await labelIdsToTitle(db, change.removeLabels)).join(', ')}`);
	}

	return messages;
};
