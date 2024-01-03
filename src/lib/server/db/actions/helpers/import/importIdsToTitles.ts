import { importTable } from '../../../postgres/schema';
import { eq } from 'drizzle-orm';
import type { DBType } from '../../../db';

const importIdToTitle = async (db: DBType, id: string) => {
	const foundImport = await db
		.select({ title: importTable.title })
		.from(importTable)
		.where(eq(importTable.id, id))
		.limit(1)
		.execute();

	if (foundImport?.length === 1) {
		return foundImport[0].title;
	}
	return id;
};

export const importIdsToTitles = async (db: DBType, ids: string[]) => {
	const titles = await Promise.all(ids.map(async (id) => importIdToTitle(db, id)));

	return titles;
};
