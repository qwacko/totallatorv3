import { tActions } from '$lib/server/db/actions/tActions';
import type { DBType } from '$lib/server/db/db';
import { logging } from '$lib/server/logging';
import { filterNullUndefinedAndDuplicates } from './filterNullUndefinedAndDuplicates';

export const getLinkedItemSummaries = async ({
	db,
	data
}: {
	db: DBType;
	data: Awaited<ReturnType<(typeof tActions)['journal']['list']>>;
}) => {
	const startTime = new Date();

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
		accountIds.map(async (id) =>
			tActions.account.getSummary({
				db,
				id
			})
		)
	);

	const tagIds = filterNullUndefinedAndDuplicates(journals.map((item) => item.tagId));
	const tagSummaries = await Promise.all(
		tagIds.map(async (id) =>
			tActions.tag.getSummary({
				db,
				id
			})
		)
	);

	const categoryIds = filterNullUndefinedAndDuplicates(journals.map((item) => item.categoryId));
	const categorySummaries = await Promise.all(
		categoryIds.map(async (id) =>
			tActions.category.getSummary({
				db,
				id
			})
		)
	);

	const billIds = filterNullUndefinedAndDuplicates(journals.map((item) => item.billId));
	const billSummaries = await Promise.all(
		billIds.map(async (id) =>
			tActions.bill.getSummary({
				db,
				id
			})
		)
	);

	const budgetIds = filterNullUndefinedAndDuplicates(journals.map((item) => item.budgetId));
	const budgetSummaries = await Promise.all(
		budgetIds.map(async (id) =>
			tActions.budget.getSummary({
				db,
				id
			})
		)
	);

	const returnInformation = [
		...accountSummaries,
		...tagSummaries,
		...billSummaries,
		...budgetSummaries,
		...categorySummaries
	];

	const endTime = new Date();
	const timeDifference = endTime.getTime() - startTime.getTime();

	if (timeDifference > 300) {
		logging.warn(
			`Retrieved Information for ${returnInformation.length} linked items in ${timeDifference}ms`
		);
	}

	return returnInformation;
};
