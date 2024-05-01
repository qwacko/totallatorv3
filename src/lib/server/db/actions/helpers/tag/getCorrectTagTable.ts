import type { DBType } from '../../../db';
import { tagMaterializedView, tagView } from '../../../postgres/schema/materializedViewSchema';
import { materializedViewActions } from '../../materializedViewActions';

export const getCorrectTagTable = async (db: DBType) => {
	const needsRefresh = await materializedViewActions.needsRefresh({
		db,
		items: { tag: true }
	});

	if (needsRefresh) {
		return { table: tagView, target: 'view' as 'view' | 'materialized' };
	}

	return { table: tagMaterializedView, target: 'materialized' as 'view' | 'materialized' };
};
