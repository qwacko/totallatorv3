import { budgetMaterializedView, budgetView } from '@totallator/database';
import { materializedViewActions } from '../../materializedViewActions';

export const getCorrectBudgetTable = async () => {
	const needsRefresh = await materializedViewActions.needsRefresh({
		items: { budget: true }
	});

	if (needsRefresh) {
		return { table: budgetView, target: 'view' as 'view' | 'materialized' };
	}

	return { table: budgetMaterializedView, target: 'materialized' as 'view' | 'materialized' };
};
