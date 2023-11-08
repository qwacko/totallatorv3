import type { UpdateJournalSchemaType } from '$lib/schema/journalSchema';
import { accountIdToTitle } from './accountFilterToQuery';
import { labelIdsToTitle } from './labelFilterToQuery';
import { billIdToTitle } from './billFilterToQuery';
import { budgetIdToTitle } from './budgetFilterToQuery';
import { categoryIdToTitle } from './categoryFilterToQuery';
import { tagIdToTitle } from './tagFilterToQuery';

export const journalUpdateToText = async (change: UpdateJournalSchemaType | undefined) => {
	if (!change) {
		return undefined;
	}

	const messages: string[] = [];

	//Journal Information
	if (change.amount) messages.push(`Amount: ${change.amount}`);
	if (change.date) messages.push(`Date: ${change.date}`);
	if (change.accountTitle) messages.push(`Account Title: ${change.accountTitle}`);
	if (change.complete !== undefined) messages.push(`Complete: ${change.complete}`);
	if (change.dataChecked !== undefined) messages.push(`Data Checked: ${change.dataChecked}`);
	if (change.description) messages.push(`Description: ${change.description}`);
	if (change.linked !== undefined) messages.push(`Linked: ${change.linked}`);
	if (change.reconciled !== undefined) messages.push(`Reconciled: ${change.reconciled}`);

	//Account
	if (change.accountId) messages.push(`Account: ${await accountIdToTitle(change.accountId)}`);
	if (change.accountTitle) messages.push(`Account Title: ${change.accountTitle}`);
	if (change.otherAccountId)
		messages.push(`Other Account: ${await accountIdToTitle(change.otherAccountId)}`);
	if (change.otherAccountTitle) messages.push(`Other Account Title: ${change.otherAccountTitle}`);

	//Budget
	if (change.budgetClear) messages.push(`Budget Clear: ${change.budgetClear}`);
	if (change.budgetId) messages.push(`Budget: ${await budgetIdToTitle(change.budgetId)}`);
	if (change.budgetTitle) messages.push(`Budget Title: ${change.budgetTitle}`);

	//Category
	if (change.categoryClear) messages.push(`Category Clear: ${change.categoryClear}`);
	if (change.categoryId) messages.push(`Category: ${await categoryIdToTitle(change.categoryId)}`);
	if (change.categoryTitle) messages.push(`Category Title: ${change.categoryTitle}`);

	//Bills
	if (change.billClear) messages.push(`Bill Clear: ${change.billClear}`);
	if (change.billId) messages.push(`Bill: ${await billIdToTitle(change.billId)}`);
	if (change.billTitle) messages.push(`Bill Title: ${change.billTitle}`);

	//Tags
	if (change.tagClear) messages.push(`Tag Clear: ${change.tagClear}`);
	if (change.tagId) messages.push(`Tag: ${await tagIdToTitle(change.tagId)}`);
	if (change.tagTitle) messages.push(`Tag Title: ${change.tagTitle}`);

	//Labels
	if (change.clearLabels) messages.push(`Clear Labels`);
	if (change.labelTitles && change.labelTitles.length > 0) {
		messages.push(`Set Labels: ${change.labelTitles.join(', ')}`);
	}
	if (change.labels && change.labels.length > 0) {
		messages.push(`Set Labels: ${(await labelIdsToTitle(change.labels)).join(', ')}`);
	}
	if (change.addLabelTitles && change.addLabelTitles.length > 0) {
		messages.push(`Add Labels: ${change.addLabelTitles.join(', ')}`);
	}
	if (change.addLabels && change.addLabels.length > 0) {
		messages.push(`Add Labels: ${(await labelIdsToTitle(change.addLabels)).join(', ')}`);
	}
	if (change.removeLabels && change.removeLabels.length > 0) {
		messages.push(`Remove Labels: ${(await labelIdsToTitle(change.removeLabels)).join(', ')}`);
	}

	return messages;
};
