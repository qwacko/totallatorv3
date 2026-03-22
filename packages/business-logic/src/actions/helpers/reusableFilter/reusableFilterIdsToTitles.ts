import { eq } from 'drizzle-orm';

import { reusableFilter, type DBType } from '@totallator/database';

import { dbExecuteLogger } from '../../../server/db/dbLogger';

const reusableFilterIdToTitle = async (db: DBType, id: string) => {
	const foundFilter = await dbExecuteLogger(
		db.select({ title: reusableFilter.title }).from(reusableFilter).where(eq(reusableFilter.id, id)).limit(1),
		'reusableFilterIdToTitle'
	);

	if (foundFilter?.length === 1) {
		return foundFilter[0].title;
	}
	return id;
};

export const reusableFilterIdsToTitles = async (db: DBType, ids: string[]) => {
	return await Promise.all(ids.map(async (id) => reusableFilterIdToTitle(db, id)));
};
