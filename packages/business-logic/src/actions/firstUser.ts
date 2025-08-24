import { count, eq } from 'drizzle-orm';

import type { GlobalContext } from '@totallator/context';
import type { DBType } from '@totallator/database';
import { user } from '@totallator/database';

import { dbExecuteLogger } from '@/server/db/dbLogger';

// Legacy function - kept for backward compatibility
export const dbUserCount = async (db: DBType): Promise<number> => {
	const resultCount = await dbExecuteLogger(db.select({ count: count() }).from(user), 'User Count');
	return resultCount[0].count;
};

// New context-based function
export const getUserCount = async ({ global }: { global: GlobalContext }): Promise<number> => {
	const resultCount = await dbExecuteLogger(
		global.db.select({ count: count() }).from(user),
		'User Count'
	);
	return resultCount[0].count;
};

// Legacy function - kept for backward compatibility
export const dbAdminCount = async (db: DBType): Promise<number> => {
	const resultCount = await dbExecuteLogger(
		db.select({ count: count() }).from(user).where(eq(user.admin, true)),
		'Admin Count'
	);
	return resultCount[0].count;
};

// New context-based function
export const getAdminCount = async ({ global }: { global: GlobalContext }): Promise<number> => {
	const resultCount = await dbExecuteLogger(
		global.db.select({ count: count() }).from(user).where(eq(user.admin, true)),
		'Admin Count'
	);
	return resultCount[0].count;
};

// Legacy function - kept for backward compatibility
export const dbIsFirstUser = async (db: DBType): Promise<boolean> => {
	const resultCount = await dbUserCount(db);
	return resultCount === 0;
};

// New context-based function
export const isFirstUser = async ({ global }: { global: GlobalContext }): Promise<boolean> => {
	const resultCount = await getUserCount({ global });
	return resultCount === 0;
};

// Legacy function - kept for backward compatibility
export const dbNoAdmins = async (db: DBType): Promise<boolean> => {
	const resultCount = await dbAdminCount(db);
	return resultCount === 0;
};

// New context-based function
export const noAdmins = async ({ global }: { global: GlobalContext }): Promise<boolean> => {
	const resultCount = await getAdminCount({ global });
	return resultCount === 0;
};
