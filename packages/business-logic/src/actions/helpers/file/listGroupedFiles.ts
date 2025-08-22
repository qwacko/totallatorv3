import { desc, eq } from 'drizzle-orm';

import { getContextDB } from '@totallator/context';
import { associatedInfoTable, fileTable, user } from '@totallator/database';
import { FileTypeType } from '@totallator/shared';

import { inArrayWrapped } from '../misc/inArrayWrapped';
import { GroupingOptions } from './FilesAndNotesActions';

export const listGroupedFiles = async ({
	ids,
	grouping
}: {
	ids: string[];
	grouping: GroupingOptions;
}) => {
	const db = getContextDB();
	const items = await db
		.select({
			id: fileTable.id,
			title: fileTable.title,
			type: fileTable.type,
			filename: fileTable.filename,
			originalFilename: fileTable.originalFilename,
			thumbnailFilename: fileTable.thumbnailFilename,
			createdAt: fileTable.createdAt,
			updatedAt: fileTable.updatedAt,
			createdById: associatedInfoTable.createdById,
			createdBy: user.username,
			groupingId: associatedInfoTable[`${grouping}Id`]
		})
		.from(fileTable)
		.leftJoin(associatedInfoTable, eq(associatedInfoTable.id, fileTable.associatedInfoId))
		.leftJoin(user, eq(user.id, associatedInfoTable.createdById))
		.where(inArrayWrapped(associatedInfoTable[`${grouping}Id`], ids))
		.orderBy(desc(fileTable.createdAt));

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

export type GroupedFilesType = {
	id: string;
	title: string | null;
	type: FileTypeType;
	filename: string;
	originalFilename: string;
	thumbnailFilename: string | null;
	createdAt: Date;
	updatedAt: Date;
	createdById: string | null;
	createdBy: string | null;
	groupingId: string | null;
}[];
