import { desc, eq } from 'drizzle-orm';

import { getContextDB } from '@totallator/context';
import { associatedInfoTable, notesTable, user } from '@totallator/database';
import { NoteTypeType } from '@totallator/shared';

import { dbExecuteLogger } from '@/server/db/dbLogger';

import { GroupingOptions } from '../file/FilesAndNotesActions';
import { inArrayWrapped } from '../misc/inArrayWrapped';

export const listGroupedNotes = async ({
	ids,
	grouping
}: {
	ids: string[];
	grouping: GroupingOptions;
}) => {
	const db = getContextDB();
	const items = await dbExecuteLogger(
		db
			.select({
				id: notesTable.id,
				note: notesTable.note,
				type: notesTable.type,
				createdAt: notesTable.createdAt,
				updatedAt: notesTable.updatedAt,
				createdById: associatedInfoTable.createdById,
				createdBy: user.username,
				groupingId: associatedInfoTable[`${grouping}Id`]
			})
			.from(notesTable)
			.leftJoin(associatedInfoTable, eq(associatedInfoTable.id, notesTable.associatedInfoId))
			.leftJoin(user, eq(user.id, associatedInfoTable.createdById))
			.where(inArrayWrapped(associatedInfoTable[`${grouping}Id`], ids))
			.orderBy(desc(notesTable.createdAt)),
		'Note - List Grouped - Get Notes'
	);

	const groupedItems = items.reduce(
		(acc, item) => {
			if (!item.groupingId) return acc;
			const groupingId = item.groupingId;
			if (!acc[groupingId]) {
				acc[groupingId] = [];
			}
			acc[groupingId].push(item);
			return acc;
		},
		{} as Record<string, typeof items>
	);

	return groupedItems;
};

export type GroupedNotesType = {
	id: string;
	note: string;
	type: NoteTypeType;
	createdAt: Date;
	updatedAt: Date;
	createdById: string | null;
	createdBy: string | null;
	groupingId: string | null;
}[];
