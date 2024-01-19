import type { JournalFilterSchemaType } from '$lib/schema/journalSchema';
import { asc, desc, SQL } from 'drizzle-orm';
import { journalExtendedView } from '../../../postgres/schema';

const defaultOrderBy = [
	desc(journalExtendedView.amount),
	desc(journalExtendedView.createdAt),
	desc(journalExtendedView.id)
];

export const journalFilterToOrderBy = (filter: JournalFilterSchemaType): SQL<unknown>[] => {
	const { orderBy } = filter;

	if (!orderBy) {
		return [desc(journalExtendedView.date), ...defaultOrderBy];
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
				return asc(journalExtendedView[currentOrder.field]);
			}
			return desc(journalExtendedView[currentOrder.field]);
		}
		if (currentOrder.field === 'accountName') {
			if (currentOrder.direction === 'asc') {
				return asc(journalExtendedView.accountTitle);
			}
			return desc(journalExtendedView.accountTitle);
		}

		return desc(journalExtendedView.date);
	});

	return [...processedOrderBy, ...defaultOrderBy];
};
