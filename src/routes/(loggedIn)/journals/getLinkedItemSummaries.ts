import { defaultAllJournalFilter } from '$lib/schema/journalSchema.js';
import { tActions } from '$lib/server/db/actions/tActions';
import type { DBType } from '$lib/server/db/db';

export const getLinkedItemSummaries = async ({
	db,
	data
}: {
	db: DBType;
	data: Awaited<ReturnType<(typeof tActions)['journal']['list']>>;
}) => {
	const journals = data.data;

	const otherJournalAccountIds = journals.reduce(
		(prev, current) => [...prev, ...current.otherJournals.map((item) => item.accountId)],
		[] as string[]
	);

	const accountIds = filterNullUndefinedAndDuplicates([
		...journals.map((item) => item.accountId),
		...otherJournalAccountIds
	]);
	const accountSummaries = await Promise.all(
		accountIds
			.filter((item) => item)
			.map(async (id) => {
				const summary = await tActions.journal.summary({
					db,
					filter: { ...defaultAllJournalFilter, account: { id } }
				});
				return {
					id: id,
					...summary
				};
			})
	);

	const tagIds = filterNullUndefinedAndDuplicates(journals.map((item) => item.tagId));
	const tagSummaries = await Promise.all(
		tagIds.map(async (id) => {
			const summary = await tActions.journal.summary({
				db,
				filter: {
					...defaultAllJournalFilter,
					tag: { id },
					account: { type: ['asset', 'liability'] }
				}
			});
			return {
				id: id,
				...summary
			};
		})
	);

	const categoryIds = filterNullUndefinedAndDuplicates(journals.map((item) => item.categoryId));
	const categorySummaries = await Promise.all(
		categoryIds
			.filter((item) => item)
			.map(async (id) => {
				const summary = await tActions.journal.summary({
					db,
					filter: {
						...defaultAllJournalFilter,
						category: { id },
						account: { type: ['asset', 'liability'] }
					}
				});
				return {
					id: id,
					...summary
				};
			})
	);

	const billIds = filterNullUndefinedAndDuplicates(journals.map((item) => item.billId));
	const billSummaries = await Promise.all(
		billIds
			.filter((item) => item)
			.map(async (id) => {
				const summary = await tActions.journal.summary({
					db,
					filter: {
						...defaultAllJournalFilter,
						bill: { id },
						account: { type: ['asset', 'liability'] }
					}
				});
				return {
					id: id,
					...summary
				};
			})
	);

	const budgetIds = filterNullUndefinedAndDuplicates(journals.map((item) => item.budgetId));
	const budgetSummaries = await Promise.all(
		budgetIds
			.filter((item) => item)
			.map(async (id) => {
				const summary = await tActions.journal.summary({
					db,
					filter: {
						...defaultAllJournalFilter,
						budget: { id },
						account: { type: ['asset', 'liability'] }
					}
				});
				return {
					id: id,
					...summary
				};
			})
	);

	return [
		...accountSummaries,
		...tagSummaries,
		...billSummaries,
		...budgetSummaries,
		...categorySummaries
	];
};
function filterNullUndefinedAndDuplicates<T>(arr: (T | null | undefined)[]): T[] {
	const seen = new Set<T>();
	return arr.filter((item): item is T => {
		if (item !== null && item !== undefined && !seen.has(item)) {
			seen.add(item);
			return true;
		}
		return false;
	});
}
