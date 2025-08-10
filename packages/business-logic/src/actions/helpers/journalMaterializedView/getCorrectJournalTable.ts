import {
	importCheckMaterializedView,
	journalExtendedView,
	journalView
} from '@totallator/database';
import { materializedViewActions } from '../../materializedViewActions';

export const getCorrectJournalTable = async () => {
	const needsRefresh = await materializedViewActions.needsRefresh({
		items: { journals: true }
	});

	if (needsRefresh) {
		return { table: journalView, target: 'view' as 'view' | 'materialized' };
	}

	return { table: journalExtendedView, target: 'materialized' as 'view' | 'materialized' };
};

export const getCorrectImportCheckTable = async () => {
	const needsRefresh = await materializedViewActions.needsRefresh({
		items: { importCheck: true }
	});

	if (needsRefresh) {
		return { table: importCheckMaterializedView, target: 'view' as 'view' | 'materialized' };
	}

	return { table: importCheckMaterializedView, target: 'materialized' as 'view' | 'materialized' };
};
