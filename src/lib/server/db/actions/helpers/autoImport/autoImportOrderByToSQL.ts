import { asc, desc, type SQL } from 'drizzle-orm';
import type { AutoImportOrderByOptionsType } from '$lib/schema/autoImportSchema';
import { autoImportTable, importMapping } from '$lib/server/db/postgres/schema';

export const autoImportToOrderByToSQL = ({
	orderBy
}: {
	orderBy?: { field: AutoImportOrderByOptionsType; direction: 'asc' | 'desc' }[];
}): SQL<unknown>[] => {
	const defaultOrderBy = [asc(autoImportTable.title), desc(autoImportTable.createdAt)];

	const orderByResult = orderBy
		? [
				...orderBy.map((currentOrder) => {
					if (currentOrder.field === 'importMapping') {
						return currentOrder.direction === 'asc'
							? asc(importMapping.title)
							: desc(importMapping.title);
					}
					let field: (typeof autoImportTable)[keyof typeof autoImportTable] =
						autoImportTable[currentOrder.field];

					return currentOrder.direction === 'asc' ? asc(field) : desc(field);
				}),
				...defaultOrderBy
			]
		: defaultOrderBy;

	return orderByResult;
};
