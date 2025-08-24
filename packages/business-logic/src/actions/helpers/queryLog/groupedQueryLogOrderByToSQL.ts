import { asc, desc, type SQL } from 'drizzle-orm';

import { queryLogTitleTable } from '@totallator/database';
import type { GroupedQueryLogOrderByEnumType } from '@totallator/shared';

import type { GroupedQueryLogSubqueryType } from './groupedQueryLogSubquery';

export const groupedQueryLogOrderByToSQL = ({
	orderBy,
	subquery
}: {
	orderBy?: {
		field: GroupedQueryLogOrderByEnumType;
		direction: 'asc' | 'desc';
	}[];
	subquery: GroupedQueryLogSubqueryType;
}): SQL<unknown>[] => {
	const defaultOrderBy = [desc(subquery.last)];

	const orderByResult = orderBy
		? [
				...orderBy.map((currentOrder) => {
					let field =
						currentOrder.field === 'title'
							? queryLogTitleTable.title
							: subquery[currentOrder.field];

					return currentOrder.direction === 'asc' ? asc(field) : desc(field);
				}),
				...defaultOrderBy
			]
		: defaultOrderBy;

	return orderByResult;
};
