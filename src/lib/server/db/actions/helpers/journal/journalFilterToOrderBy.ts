import type { JournalFilterSchemaType } from '$lib/schema/journalSchema';
import { asc, desc, SQL } from 'drizzle-orm';
import { account, journalEntry } from '../../../postgres/schema';

const defaultOrderBy = [
	desc(journalEntry.amount),
	desc(journalEntry.createdAt),
	desc(journalEntry.id)
];

export const journalFilterToOrderBy = (filter: JournalFilterSchemaType): SQL<unknown>[] => {
	const { orderBy } = filter;

	if (!orderBy) {
		return [desc(journalEntry.date), ...defaultOrderBy];
	}
	const processedOrderBy = orderBy.map((currentOrder) => {
		if (
			currentOrder.field === 'amount' ||
			currentOrder.field === 'complete' ||
			currentOrder.field === 'dataChecked' ||
			currentOrder.field === 'date' ||
			currentOrder.field === 'description' ||
			currentOrder.field === 'linked' ||
			currentOrder.field === 'reconciled'
		) {
			if (currentOrder.direction === 'asc') {
				return asc(journalEntry[currentOrder.field]);
			}
			return desc(journalEntry[currentOrder.field]);
		}
		if (currentOrder.field === 'accountName') {
			if (currentOrder.direction === 'asc') {
				return asc(account.title);
			}
			return desc(account.title);
		}

		return desc(journalEntry.createdAt);
	});

	return [...processedOrderBy, ...defaultOrderBy];
};
