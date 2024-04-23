import { count, eq } from 'drizzle-orm';
import type { DBType } from '../db';
import { user } from '../postgres/schema';
import { dbExecuteLogger } from '../dbLogger';

export const dbUserCount = async (db: DBType) => {
	const resultCount = await dbExecuteLogger(db.select({ count: count() }).from(user), 'User Count');

	return resultCount[0].count;
};

export const dbAdminCount = async (db: DBType) => {
	const resultCount = await dbExecuteLogger(
		db.select({ count: count() }).from(user).where(eq(user.admin, true)),
		'Admin Count'
	);

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
