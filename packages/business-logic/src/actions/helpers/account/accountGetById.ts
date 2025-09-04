import { eq } from 'drizzle-orm';

import { getContextDB } from '@totallator/context';
import { account } from '@totallator/database';

import { dbExecuteLogger } from '@/server/db/dbLogger';

export const accountGetById = async (id: string) => {
	const db = getContextDB();
	return dbExecuteLogger(
		db.query.account.findFirst({ where: eq(account.id, id) }),
		'Accounts - Get By ID'
	);
};
