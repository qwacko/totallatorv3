import type { DBType } from '../../../db';
import {
	budgetMaterializedView,
	budgetView
} from '../../../postgres/schema/materializedViewSchema';
import { materializedViewActions } from '../../materializedViewActions';

export const getCorrectBudgetTable = async (db: DBType) => {
	const needsRefresh = await materializedViewActions.needsRefresh({
		db,
		items: { budget: true }
	});

	if (needsRefresh) {
		return { table: budgetView, target: 'view' as 'view' | 'materialized' };
	}

	return { table: budgetMaterializedView, target: 'materialized' as 'view' | 'materialized' };
};
