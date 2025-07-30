import type { DBType } from '@totallator/database';
import { billMaterializedView, billView } from '@totallator/database';
import { materializedViewActions } from '../../materializedViewActions';

export const getCorrectBillTable = async (db: DBType) => {
	const needsRefresh = await materializedViewActions.needsRefresh({
		db,
		items: { bill: true }
	});

	if (needsRefresh) {
		return { table: billView, target: 'view' as 'view' | 'materialized' };
	}

	return { table: billMaterializedView, target: 'materialized' as 'view' | 'materialized' };
};
