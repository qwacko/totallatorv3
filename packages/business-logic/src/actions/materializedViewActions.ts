import { eq, sql } from 'drizzle-orm';
import type { DBType } from '@totallator/database';
import { reusableFilter } from '@totallator/database';
import {
	journalExtendedView,
	accountMaterializedView,
	tagMaterializedView,
	billMaterializedView,
	budgetMaterializedView,
	categoryMaterializedView,
	labelMaterializedView,
	dateRangeMaterializedView,
	importCheckMaterializedView
} from '@totallator/database';

import { booleanKeyValueStore } from './helpers/keyValueStore';
import { getLogger } from '@/logger';
import { dbExecuteRawLogger, dbExecuteLogger } from '@/server/db/dbLogger';
import { getServerEnv } from '@/serverEnv';
import { getContext } from '@/context';

const refreshRequiredStore = booleanKeyValueStore('journalExtendedViewRefresh', true);
const accountRefreshRequiredStore = booleanKeyValueStore('accountViewRefresh', true);
const tagRefreshRequiredStore = booleanKeyValueStore('tagViewRefresh', true);
const billRefreshRequiredStore = booleanKeyValueStore('billViewRefresh', true);
const budgetRefreshRequiredStore = booleanKeyValueStore('budgetViewRefresh', true);
const categoryRefreshRequiredStore = booleanKeyValueStore('categoryViewRefresh', true);
const labelRefreshRequiredStore = booleanKeyValueStore('labelViewRefresh', true);
const dateTimeRefreshRequiredStore = booleanKeyValueStore('dateTimeViewRefresh', true);
const importCheckRefreshRequiredStore = booleanKeyValueStore('importCheckViewRefresh', true);

const logRefreshTime = false;

const timePromise = async <T>(title: string, enable: boolean | undefined, fn: () => Promise<T>) => {
	if (!enable) return;
	const startTime = Date.now();
	const result = await fn();
	const endTime = Date.now();

	if (logRefreshTime) {
		getLogger().info(`${title} took ${endTime - startTime}ms`);
	}

	return result;
};

type itemsType = {
	journals?: boolean;
	account?: boolean;
	tag?: boolean;
	bill?: boolean;
	budget?: boolean;
	category?: boolean;
	label?: boolean;
	importCheck?: boolean;
};

const itemsDefault = {
	journals: true,
	account: true,
	tag: true,
	bill: true,
	budget: true,
	category: true,
	label: true,
	importCheck: true
};

const useConcurrentRefresh = () =>
	getServerEnv().CONCURRENT_REFRESH === undefined ? true : getServerEnv().CONCURRENT_REFRESH;

export const materializedViewActions = {
	refresh: async ({
		db,
		items = itemsDefault
	}: {
		db: DBType;
		logStats?: boolean;
		items?: itemsType;
	}): Promise<void> => {
		await Promise.all([
			timePromise('Journal Extended View Refresh', items.journals, async () => {
				if (useConcurrentRefresh()) {
					await dbExecuteRawLogger(
						db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY ${journalExtendedView}`),
						'View Refresh - Journal Extended View (Concurrent)'
					);
				} else {
					await dbExecuteLogger(
						db.refreshMaterializedView(journalExtendedView),
						'View Refresh - Journal Extended View'
					);
				}
				await refreshRequiredStore.set(db, false);
			}),
			timePromise('Account View Refresh', items.account, async () => {
				if (useConcurrentRefresh()) {
					await dbExecuteRawLogger(
						db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY ${accountMaterializedView}`),
						'View Refresh - Account View (Concurrent)'
					);
				} else {
					await dbExecuteLogger(
						db.refreshMaterializedView(accountMaterializedView),
						'View Refresh - Account View'
					);
				}
				await accountRefreshRequiredStore.set(db, false);
			}),
			timePromise('Tag View Refresh', items.tag, async () => {
				if (useConcurrentRefresh()) {
					await dbExecuteRawLogger(
						db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY ${tagMaterializedView}`),
						'View Refresh - Tag View (Concurrent)'
					);
				} else {
					await dbExecuteLogger(
						db.refreshMaterializedView(tagMaterializedView),
						'View Refresh - Tag View'
					);
				}
				await tagRefreshRequiredStore.set(db, false);
			}),
			timePromise('Bill View Refresh', items.bill, async () => {
				if (useConcurrentRefresh()) {
					await dbExecuteRawLogger(
						db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY ${billMaterializedView}`),
						'View Refresh - Bill View (Concurrent)'
					);
				} else {
					await dbExecuteLogger(
						db.refreshMaterializedView(billMaterializedView),
						'View Refresh - Bill View'
					);
				}
				await billRefreshRequiredStore.set(db, false);
			}),
			timePromise('Budget View Refresh', items.budget, async () => {
				if (useConcurrentRefresh()) {
					await dbExecuteRawLogger(
						db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY ${budgetMaterializedView}`),
						'View Refresh - Budget View (Concurrent)'
					);
				} else {
					await dbExecuteLogger(
						db.refreshMaterializedView(budgetMaterializedView),
						'View Refresh - Budget View'
					);
				}
				await budgetRefreshRequiredStore.set(db, false);
			}),
			timePromise('Category View Refresh', items.category, async () => {
				if (useConcurrentRefresh()) {
					await dbExecuteRawLogger(
						db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY ${categoryMaterializedView}`),
						'View Refresh - Category View (Concurrent)'
					);
				} else {
					await dbExecuteLogger(
						db.refreshMaterializedView(categoryMaterializedView),
						'View Refresh - Category View'
					);
				}
				await categoryRefreshRequiredStore.set(db, false);
			}),
			timePromise('Label View Refresh', items.label, async () => {
				if (useConcurrentRefresh()) {
					await dbExecuteRawLogger(
						db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY ${labelMaterializedView}`),
						'View Refresh - Label View (Concurrent)'
					);
				} else {
					await dbExecuteLogger(
						db.refreshMaterializedView(labelMaterializedView),
						'View Refresh - Label View'
					);
				}
				await labelRefreshRequiredStore.set(db, false);
			}),
			timePromise('Date Time View Refresh', items.label, async () => {
				await dateTimeRefreshRequiredStore.set(db, false);
				await dbExecuteLogger(
					db.refreshMaterializedView(dateRangeMaterializedView),
					'View Refresh - Date Time View'
				);
			}),
			timePromise('Import Check View Refresh', items.importCheck, async () => {
				await dbExecuteLogger(
					db.refreshMaterializedView(importCheckMaterializedView),
					'View Refresh - Import Check View'
				);
			})
		]);
	},
	needsRefresh: async ({
		db,
		items = itemsDefault
	}: {
		db: DBType;
		items?: itemsType;
	}): Promise<boolean> => {
		const itemsRequiringUpdate = {
			account: await accountRefreshRequiredStore.get(db),
			tag: await tagRefreshRequiredStore.get(db),
			bill: await billRefreshRequiredStore.get(db),
			budget: await budgetRefreshRequiredStore.get(db),
			category: await categoryRefreshRequiredStore.get(db),
			label: await labelRefreshRequiredStore.get(db),
			journals: await refreshRequiredStore.get(db),
			importCheck: await importCheckRefreshRequiredStore.get(db)
		};

		const needsUpdate = Object.keys(items).some(
			(key) => itemsRequiringUpdate[key as any as keyof typeof itemsRequiringUpdate]
		);

		return needsUpdate;
	},
	conditionalRefresh: async ({
		db,
		logStats = false,
		items = itemsDefault
	}: {
		db: DBType;
		logStats?: boolean;
		items?: itemsType;
	}): Promise<boolean> => {
		const needsUpdate = await materializedViewActions.needsRefresh({ db, items });

		if (!needsUpdate) return false;

		await materializedViewActions.refresh({ db, logStats, items });
		return true;
	},

	// Context-based version
	conditionalRefreshWithContext: async ({
		global,
		logStats = false,
		items = itemsDefault
	}: {
		global: any; // Will be properly typed once we import GlobalContext
		logStats?: boolean;
		items?: itemsType;
	}): Promise<boolean> => {
		return materializedViewActions.conditionalRefresh({
			db: global.db,
			logStats,
			items
		});
	},
	setRefreshRequired: async (db: DBType): Promise<void> => {
		await Promise.all([
			refreshRequiredStore.set(db, true),
			accountRefreshRequiredStore.set(db, true),
			tagRefreshRequiredStore.set(db, true),
			billRefreshRequiredStore.set(db, true),
			budgetRefreshRequiredStore.set(db, true),
			categoryRefreshRequiredStore.set(db, true),
			labelRefreshRequiredStore.set(db, true),
			dateTimeRefreshRequiredStore.set(db, true),
			importCheckRefreshRequiredStore.set(db, true),
			dbExecuteLogger(
				db
					.update(reusableFilter)
					.set({ needsUpdate: true })
					.where(eq(reusableFilter.needsUpdate, false)),
				'Set Refresh Required - True'
			)
		]);

		// Update the materialized view refresh rate limiter
		// This will reset the timeout - if no more setRefreshRequired calls come in within
		// the timeout period, the refresh will be triggered automatically
		try {
			const { getGlobalContext } = await import('@totallator/context');
			const globalContext = getGlobalContext();
			globalContext.viewRefreshLimiter.updateLastRequest();
		} catch (error) {
			// If context is not available (e.g., during tests), just skip the rate limiting
			console.warn('Could not access global context for view refresh rate limiting:', error);
		}
	}
};
