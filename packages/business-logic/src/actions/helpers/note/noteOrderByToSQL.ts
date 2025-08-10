import { asc, desc, type SQL } from 'drizzle-orm';
import type { NoteOrderByEnumType } from '@totallator/shared';
import { notesTable } from '@totallator/database';

export const noteToOrderByToSQL = ({
	orderBy
}: {
	orderBy?: { field: NoteOrderByEnumType; direction: 'asc' | 'desc' }[];
}): SQL<unknown>[] => {
	const defaultOrderBy = [desc(notesTable.createdAt)];

	const orderByResult = orderBy
		? [
				...orderBy.map((currentOrder) => {
					let field = notesTable[currentOrder.field];

					return currentOrder.direction === 'asc' ? asc(field) : desc(field);
				}),
				...defaultOrderBy
			]
		: defaultOrderBy;

	return orderByResult;
};
