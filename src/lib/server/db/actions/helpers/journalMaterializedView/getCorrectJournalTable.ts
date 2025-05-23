import type { DBType } from '../../../db';
import {
	importCheckMaterializedView,
	journalExtendedView,
	journalView
} from '../../../postgres/schema/materializedViewSchema';
import { materializedViewActions } from '../../materializedViewActions';

export const getCorrectJournalTable = async (db: DBType) => {
	const needsRefresh = await materializedViewActions.needsRefresh({
		db,
		items: { journals: true }
	});

	if (needsRefresh) {
		return { table: journalView, target: 'view' as 'view' | 'materialized' };
	}

	return { table: journalExtendedView, target: 'materialized' as 'view' | 'materialized' };
};

export const getCorrectImportCheckTable = async (db: DBType) => {
	const needsRefresh = await materializedViewActions.needsRefresh({
		db,
		items: { importCheck: true }
	});

	if (needsRefresh) {
		return { table: importCheckMaterializedView, target: 'view' as 'view' | 'materialized' };
	}

	return { table: importCheckMaterializedView, target: 'materialized' as 'view' | 'materialized' };
};
