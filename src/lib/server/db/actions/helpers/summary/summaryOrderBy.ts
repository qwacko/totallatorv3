import { summaryTable } from '../../../postgres/schema';
import { SQL, asc, desc } from 'drizzle-orm';

type SummarySortOptions = 'count' | 'sum' | 'firstDate' | 'lastDate';
export const summaryOrderBy = <U extends string>(
	currentOrder: {
		field: SummarySortOptions | U;
		direction: 'asc' | 'desc';
	},
	restFunction: (orderInfo: { field: U; direction: 'asc' | 'desc' }) => SQL<unknown>
) => {
	if (
		currentOrder.field === 'count' ||
		currentOrder.field === 'sum' ||
		currentOrder.field === 'firstDate' ||
		currentOrder.field === 'lastDate'
	) {
		const field = currentOrder.field as SummarySortOptions;
		return currentOrder.direction === 'asc' ? asc(summaryTable[field]) : desc(summaryTable[field]);
	}

	// Since field is not one of the SummarySortOptions, it must be of type U here
	return restFunction({ field: currentOrder.field as U, direction: currentOrder.direction });
};
