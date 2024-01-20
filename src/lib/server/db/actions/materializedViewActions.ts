import { sql } from 'drizzle-orm';
import type { DBType } from '../db';
import {
	accountMaterializedView,
	billMaterializedView,
	journalExtendedView,
	tagMaterializedView,
	categoryMaterializedView,
	budgetMaterializedView,
	labelMaterializedView,
	materializedViewTableNames
} from '../postgres/schema/materializedViewSchema';
import {
	getMaterializedViewConfig,
	type PgMaterializedViewWithSelection
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { booleanKeyValueStore, keyValueStore } from './helpers/keyValueStore';

const refreshRequiredStore = booleanKeyValueStore('journalExtendedViewRefresh', true);

const materializedViewValue = '4';
const materialisedVersionStore = keyValueStore('materializedViewVersion');

const checkIfMaterializedViewExists = async (db: DBType) => {
	const value = await materialisedVersionStore.get(db);

	const journalMaterializedViewExists = await db.execute(sql`SELECT matviewname FROM pg_matviews;`);

	if (journalMaterializedViewExists.length === 0) return false;

	const materializedViewTitles = journalMaterializedViewExists.map((view) => view.matviewname);
	const targetMaterializedViewTitles = Object.keys(materializedViewTableNames).map(
		(key) => materializedViewTableNames[key as any as keyof typeof materializedViewTableNames]
	);

	const allViewsExist = targetMaterializedViewTitles.every((title) =>
		materializedViewTitles.includes(title)
	);

	if (!allViewsExist) return false;

	return value === materializedViewValue;
};

const updateMaterializedViewVersion = async (db: DBType) => {
	await materialisedVersionStore.set(db, materializedViewValue);
};

export const materializedViewActions = {
	initialize: async (db: DBType) => {
		const startTime = new Date();

		const materializedViewExists = await checkIfMaterializedViewExists(db);

		if (!materializedViewExists) {
			await recreateMaterializedViewList(db, [
				journalExtendedView,
				accountMaterializedView,
				tagMaterializedView,
				billMaterializedView,
				budgetMaterializedView,
				categoryMaterializedView,
				labelMaterializedView
			]);

			//Add indexes to materialized views
			await createIndexes({
				db,
				tableName: materializedViewTableNames.journalExtendedView,
				columns: [journalExtendedView.id.name, journalExtendedView.accountId.name]
			});

			await updateMaterializedViewVersion(db);
		}

		const endTime = new Date();
		console.log(`Initialized materialized views in ${endTime.getTime() - startTime.getTime()}ms`);
	},
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

const recreateMaterializedViewList = async (
	db: DBType,
	materializedList: PgMaterializedViewWithSelection<any, any, any>[]
) => {
	await db.transaction(async (transactionDB) => {
		for (let i = materializedList.length - 1; i >= 0; i--) {
			const materializedView = materializedList[i];
			await transactionDB.execute(sql`drop materialized view if exists ${materializedView}`);
			await transactionDB.execute(
				sql`create materialized view ${materializedView} as ${
					getMaterializedViewConfig(materializedView).query
				}`
			);
		}
	});
};

const createIndexes = async ({
	db,
	tableName,
	columns
}: {
	db: DBType;
	tableName: string;
	columns: string[];
}) => {
	await db.transaction(async (transactionDB) => {
		for (let i = columns.length - 1; i >= 0; i--) {
			const indexTitle = `index_${nanoid().replace('-', '').replace('_', '')}`;

			const column = columns[i];
			await transactionDB.execute(
				sql.raw(`create index ${indexTitle} on ${tableName} (${column})`)
			);
		}
	});
};
