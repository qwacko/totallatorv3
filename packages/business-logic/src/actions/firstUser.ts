import { count, eq } from 'drizzle-orm';

import type { GlobalContext } from '@totallator/context';
import type { DBType } from '@totallator/database';
import { user } from '@totallator/database';

import { dbExecuteLogger } from '../server/db/dbLogger';

export const getUserCount = async ({ global }: { global: GlobalContext }): Promise<number> => {
	const resultCount = await dbExecuteLogger(
		global.db.select({ count: count() }).from(user),
		'User Count'
	);
	return resultCount[0].count;
};

export const dbAdminCount = async (db: DBType): Promise<number> => {
	const resultCount = await dbExecuteLogger(
		db.select({ count: count() }).from(user).where(eq(user.admin, true)),
		'Admin Count'
	);
	return resultCount[0].count;
};

export const getAdminCount = async ({ global }: { global: GlobalContext }): Promise<number> => {
	const resultCount = await dbExecuteLogger(
		global.db.select({ count: count() }).from(user).where(eq(user.admin, true)),
		'Admin Count'
	);
	return resultCount[0].count;
};

export const dbNoAdmins = async (db: DBType): Promise<boolean> => {
	const resultCount = await dbAdminCount(db);
	return resultCount === 0;
};

export const noAdmins = async ({ global }: { global: GlobalContext }): Promise<boolean> => {
	const resultCount = await getAdminCount({ global });
	return resultCount === 0;
};
