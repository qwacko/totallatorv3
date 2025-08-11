import { getContextDB } from '@totallator/context';
import { GroupingIdOptions } from '../file/FilesAndNotesActions';
import { fileTable, journalSnapshotTable, notesTable } from '@totallator/database';

export const listGroupedAssociatedInfo = async ({
	ids,
	grouping
}: {
	ids: string[];
	grouping: GroupingIdOptions;
}) => {
	const db = getContextDB();
	const items = await db.query.associatedInfoTable.findMany({
		where: (targetTable, { inArray }) => inArray(targetTable[grouping], ids),
		orderBy: (targetTable, { desc }) => [desc(targetTable.createdAt)],
		with: {
			files: true,
			journalSnapshots: true,
			notes: true,
			user: {
				columns: { name: true }
			}
		}
	});

	const groupedItems = items.reduce(
		(acc, item) => {
			if (!item[grouping]) return acc;
			const groupingId = item[grouping];
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

export type AssociatedInfoDataType = {
	id: string;
	title: string | null;
	createdAt: Date;
	updatedAt: Date;
	linked: boolean;
	createdById: string | null;
	notes: (typeof notesTable.$inferSelect)[];
	user: { name: string } | null;
	files: (typeof fileTable.$inferSelect)[];
	journalSnapshots: (typeof journalSnapshotTable.$inferSelect)[];
};
