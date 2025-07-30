import type { DBType } from '@totallator/database';
import { accountMaterializedView, accountView } from '@totallator/database';
import { materializedViewActions } from '../../materializedViewActions';

export const getCorrectAccountTable = async (db: DBType) => {
	const needsRefresh = await materializedViewActions.needsRefresh({
		db,
		items: { account: true }
	});

	if (needsRefresh) {
		return { table: accountView, target: 'view' as 'view' | 'materialized' };
	}

	return { table: accountMaterializedView, target: 'materialized' as 'view' | 'materialized' };
};
