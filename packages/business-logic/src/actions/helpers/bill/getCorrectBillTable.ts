import { billMaterializedView, billView } from '@totallator/database';

import { materializedViewActions } from '../../materializedViewActions';

export const getCorrectBillTable = async () => {
	const needsRefresh = await materializedViewActions.needsRefresh({
		items: { bill: true }
	});

	if (needsRefresh) {
		return { table: billView, target: 'view' as 'view' | 'materialized' };
	}

	return {
		table: billMaterializedView,
		target: 'materialized' as 'view' | 'materialized'
	};
};
