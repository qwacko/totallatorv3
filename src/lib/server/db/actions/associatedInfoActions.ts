import { and, eq, isNull } from 'drizzle-orm';
import type { DBType } from '../db';
import { associatedInfoTable, fileTable, notesTable } from '../postgres/schema';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';

export const associatedInfoActions = {
	removeUnnecesssary: async ({ db }: { db: DBType }) => {
		const itemsToDelete = await db
			.select({ id: associatedInfoTable.id, fileId: fileTable.id, noteId: notesTable.id })
			.from(associatedInfoTable)
			.leftJoin(fileTable, eq(associatedInfoTable.id, fileTable.associatedInfoId))
			.leftJoin(notesTable, eq(associatedInfoTable.id, notesTable.associatedInfoId))
			.where(and(isNull(fileTable.associatedInfoId), isNull(notesTable.associatedInfoId)));

		if (itemsToDelete.length > 0) {
			await db.delete(associatedInfoTable).where(
				inArrayWrapped(
					associatedInfoTable.id,
					itemsToDelete.map((item) => item.id)
				)
			);
		}
	}
};
