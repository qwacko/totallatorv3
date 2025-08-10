import { asc, desc, type SQL } from 'drizzle-orm';
import { associatedInfoTable, fileTable } from '@totallator/database';
import type { FileOrderByEnumType } from '@totallator/shared';

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
						currentOrder.field === 'exists'
							? fileTable.fileExists
							: currentOrder.field === 'linked'
								? associatedInfoTable.linked
								: fileTable[currentOrder.field];

					return currentOrder.direction === 'asc' ? asc(field) : desc(field);
				}),
				...defaultOrderBy
			]
		: defaultOrderBy;

	return orderByResult;
};
