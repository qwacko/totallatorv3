import { count, eq } from 'drizzle-orm';
import type { DBType } from '../db';
import { user } from '../postgres/schema';

export const dbUserCount = async (db: DBType) => {
	const resultCount = await db.select({ count: count() }).from(user).execute();

	return resultCount[0].count;
};

export const dbAdminCount = async (db: DBType) => {
	const resultCount = await db
		.select({ count: count() })
		.from(user)
		.where(eq(user.admin, true))
		.execute();

	return resultCount[0].count;
};

export const dbIsFirstUser = async (db: DBType) => {
	const resultCount = await dbUserCount(db);

	return resultCount === 0;
};

export const dbNoAdmins = async (db: DBType) => {
	const resultCount = await dbAdminCount(db);

	return resultCount === 0;
};
