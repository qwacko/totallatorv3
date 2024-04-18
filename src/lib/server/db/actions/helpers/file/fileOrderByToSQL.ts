import { asc, desc, type SQL } from 'drizzle-orm';
import { fileTable } from '$lib/server/db/postgres/schema';
import type { FileOrderByEnumType } from '$lib/schema/enum/fileOrderByEnum';

export const fileToOrderByToSQL = ({
	orderBy
}: {
	orderBy?: { field: FileOrderByEnumType; direction: 'asc' | 'desc' }[];
}): SQL<unknown>[] => {
	const defaultOrderBy = [desc(fileTable.createdAt)];

	const orderByResult = orderBy
		? [
				...orderBy.map((currentOrder) => {
					let field =
						currentOrder.field === 'exists' ? fileTable.fileExists : fileTable[currentOrder.field];

					return currentOrder.direction === 'asc' ? asc(field) : desc(field);
				}),
				...defaultOrderBy
			]
		: defaultOrderBy;

	return orderByResult;
};
