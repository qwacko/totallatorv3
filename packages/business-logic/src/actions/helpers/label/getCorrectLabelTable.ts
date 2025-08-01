import { labelMaterializedView, labelView } from '@totallator/database';
import { materializedViewActions } from '../../materializedViewActions';

export const getCorrectLabelTable = async () => {
	const needsRefresh = await materializedViewActions.needsRefresh({
		items: { label: true }
	});

	if (needsRefresh) {
		return { table: labelView, target: 'view' as 'view' | 'materialized' };
	}

	return { table: labelMaterializedView, target: 'materialized' as 'view' | 'materialized' };
};
