import { categoryMaterializedView, categoryView } from '@totallator/database';
import { materializedViewActions } from '../../materializedViewActions';

export const getCorrectCategoryTable = async () => {
	const needsRefresh = await materializedViewActions.needsRefresh({
		items: { category: true }
	});

	if (needsRefresh) {
		return { table: categoryView, target: 'view' as 'view' | 'materialized' };
	}

	return { table: categoryMaterializedView, target: 'materialized' as 'view' | 'materialized' };
};
