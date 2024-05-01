import type { DBType } from '../../../db';
import {
	categoryMaterializedView,
	categoryView
} from '../../../postgres/schema/materializedViewSchema';
import { materializedViewActions } from '../../materializedViewActions';

export const getCorrectCategoryTable = async (db: DBType) => {
	const needsRefresh = await materializedViewActions.needsRefresh({
		db,
		items: { category: true }
	});

	if (needsRefresh) {
		return { table: categoryView, target: 'view' as 'view' | 'materialized' };
	}

	return { table: categoryMaterializedView, target: 'materialized' as 'view' | 'materialized' };
};
