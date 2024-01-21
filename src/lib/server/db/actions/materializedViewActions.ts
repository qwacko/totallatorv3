import type { DBType } from '../db';
import {
	journalExtendedView,
	accountMaterializedView,
	tagMaterializedView,
	billMaterializedView,
	budgetMaterializedView,
	categoryMaterializedView,
	labelMaterializedView
} from '../postgres/schema/materializedViewSchema';

import { booleanKeyValueStore } from './helpers/keyValueStore';

const refreshRequiredStore = booleanKeyValueStore('journalExtendedViewRefresh', true);

export const materializedViewActions = {
	refresh: async ({ db, logStats = false }: { db: DBType; logStats?: boolean }) => {
		const startTime = Date.now();

		await Promise.all([
			db.refreshMaterializedView(journalExtendedView),
			db.refreshMaterializedView(accountMaterializedView),
			db.refreshMaterializedView(tagMaterializedView),
			db.refreshMaterializedView(billMaterializedView),
			db.refreshMaterializedView(budgetMaterializedView),
			db.refreshMaterializedView(categoryMaterializedView),
			db.refreshMaterializedView(labelMaterializedView)
		]);

		const endTime = Date.now();
		if (logStats) {
			console.log(`Refreshed ${journalExtendedView} in ${endTime - startTime}ms`);
		}
	},
	conditionalRefresh: async ({ db, logStats = false }: { db: DBType; logStats?: boolean }) => {
		if (await refreshRequiredStore.get(db)) {
			await materializedViewActions.refresh({ db, logStats });
			await refreshRequiredStore.set(db, false);
		}
	},
	setRefreshRequired: async (db: DBType) => {
		await refreshRequiredStore.set(db, true);
	}
};
