import {
	importCheckMaterializedView,
	journalExtendedView,
	journalView
} from '@totallator/database';
import { materializedViewActions } from '../../materializedViewActions';

// Simplified return type to avoid complex type inference
export const getCorrectJournalTable = async (): Promise<{
	table: any;
	target: 'view' | 'materialized';
}> => {
	const needsRefresh = await materializedViewActions.needsRefresh({
		items: { journals: true }
	});

	if (needsRefresh) {
		return {
			table: journalView,
			target: 'view'
		};
	}

	return { table: journalExtendedView, target: 'materialized' };
};

export const getCorrectImportCheckTable = async (): Promise<{
	table: any;
	target: 'view' | 'materialized';
}> => {
	const needsRefresh = await materializedViewActions.needsRefresh({
		items: { importCheck: true }
	});

	if (needsRefresh) {
		return { table: importCheckMaterializedView, target: 'view' };
	}

	return { table: importCheckMaterializedView, target: 'materialized' as 'view' | 'materialized' };
};
