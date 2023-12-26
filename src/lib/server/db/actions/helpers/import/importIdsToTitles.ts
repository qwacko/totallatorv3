import { importTable } from '../../../postgres/schema';
import { eq } from 'drizzle-orm';
import { db } from '../../../db';

const importIdToTitle = async (id: string) => {
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

export const importIdsToTitles = async (ids: string[]) => {
	const titles = await Promise.all(ids.map(async (id) => importIdToTitle(id)));

	return titles;
};
