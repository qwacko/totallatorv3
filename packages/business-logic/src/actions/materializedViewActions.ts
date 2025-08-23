import { eq, sql } from 'drizzle-orm';

import { getContextStore } from '@totallator/context';
import { reusableFilter } from '@totallator/database';
import {
	accountMaterializedView,
	billMaterializedView,
	budgetMaterializedView,
	categoryMaterializedView,
	dateRangeMaterializedView,
	importCheckMaterializedView,
	journalExtendedView,
	labelMaterializedView,
	tagMaterializedView
} from '@totallator/database';

import { getLogger } from '@/logger';
import { dbExecuteLogger, dbExecuteRawLogger } from '@/server/db/dbLogger';
import { getServerEnv } from '@/serverEnv';

import { booleanKeyValueStore } from './helpers/keyValueStore';

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
	if (!enable) {
		getLogger('materialized-views').trace({
			code: 'MV_060',
			title: `Skipping ${title} - not enabled in refresh items`
		});
		return;
	}

	getLogger('materialized-views').debug({
		code: 'MV_061',
		title: `Starting ${title}`,
		viewTitle: title
	});

	const startTime = Date.now();
	try {
		const result = await fn();
		const endTime = Date.now();
		const duration = endTime - startTime;

		if (logRefreshTime) {
			getLogger('materialized-views').info({
				code: 'MAT_VIEW_001',
				title: `${title} took ${duration}ms`,
				viewTitle: title,
				duration
			});
		}

		getLogger('materialized-views').debug({
			code: 'MV_062',
			title: `Successfully completed ${title}`,
			viewTitle: title,
			duration
		});

		return result;
	} catch (error) {
		const endTime = Date.now();
		const duration = endTime - startTime;

		getLogger('materialized-views').error({
			code: 'MV_063',
			title: `Failed to complete ${title}`,
			viewTitle: title,
			duration,
			error
		});
		throw error;
	}
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
		items = itemsDefault
	}: {
		logStats?: boolean;
		items?: itemsType;
	} = {}): Promise<void> => {
		const refreshStartTime = Date.now();
		const viewsToRefresh = Object.keys(items).filter((key) => items[key as keyof typeof items]);

		getLogger('materialized-views').info({
			code: 'MV_010',
			title: 'Starting materialized view refresh',
			viewsToRefresh,
			viewCount: viewsToRefresh.length,
			concurrentRefresh: useConcurrentRefresh()
		});

		const context = getContextStore();
		const db = context.global.db;

		try {
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

			const refreshDuration = Date.now() - refreshStartTime;
			getLogger('materialized-views').info({
				code: 'MV_011',
				title: 'Materialized view refresh completed',
				viewsRefreshed: viewsToRefresh,
				viewCount: viewsToRefresh.length,
				duration: refreshDuration
			});
		} catch (error) {
			const refreshDuration = Date.now() - refreshStartTime;
			getLogger('materialized-views').error({
				code: 'MV_012',
				title: 'Materialized view refresh failed',
				viewsToRefresh,
				viewCount: viewsToRefresh.length,
				duration: refreshDuration,
				error
			});
			throw error;
		}
	},
	needsRefresh: async ({ items = itemsDefault }: { items?: itemsType }): Promise<boolean> => {
		getLogger('materialized-views').debug({
			code: 'MV_020',
			title: 'Checking if materialized views need refresh',
			itemsToCheck: Object.keys(items).filter((key) => items[key as keyof typeof items])
		});

		const context = getContextStore();
		const db = context.global.db;

		try {
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

			const viewsNeedingRefresh = Object.keys(items)
				.filter((key) => items[key as keyof typeof items])
				.filter((key) => itemsRequiringUpdate[key as keyof typeof itemsRequiringUpdate]);

			getLogger('materialized-views').debug({
				code: 'MV_021',
				title: 'Materialized view refresh check completed',
				needsUpdate,
				viewsNeedingRefresh,
				viewsNeedingRefreshCount: viewsNeedingRefresh.length,
				allItemsRequiringUpdate: itemsRequiringUpdate
			});

			return needsUpdate;
		} catch (error) {
			getLogger('materialized-views').error({
				code: 'MV_022',
				title: 'Failed to check materialized view refresh status',
				itemsToCheck: Object.keys(items).filter((key) => items[key as keyof typeof items]),
				error
			});
			throw error;
		}
	},
	conditionalRefresh: async ({
		logStats = false,
		items = itemsDefault
	}: {
		logStats?: boolean;
		items?: itemsType;
	}): Promise<boolean> => {
		getLogger('materialized-views').debug({
			code: 'MV_030',
			title: 'Starting conditional materialized view refresh',
			logStats,
			itemsToCheck: Object.keys(items).filter((key) => items[key as keyof typeof items])
		});

		try {
			const needsUpdate = await materializedViewActions.needsRefresh({ items });

			if (!needsUpdate) {
				getLogger('materialized-views').debug({
					code: 'MV_031',
					title: 'Conditional refresh skipped - no views need updating'
				});
				return false;
			}

			getLogger('materialized-views').info({
				code: 'MV_032',
				title: 'Conditional refresh proceeding - views need updating'
			});

			await materializedViewActions.refresh({ logStats, items });

			getLogger('materialized-views').debug({
				code: 'MV_033',
				title: 'Conditional refresh completed successfully'
			});

			return true;
		} catch (error) {
			getLogger('materialized-views').error({
				code: 'MV_034',
				title: 'Conditional refresh failed',
				logStats,
				itemsToCheck: Object.keys(items).filter((key) => items[key as keyof typeof items]),
				error
			});
			throw error;
		}
	},

	// Context-based version
	conditionalRefreshWithContext: async ({
		logStats = false,
		items = itemsDefault
	}: {
		logStats?: boolean;
		items?: itemsType;
	}): Promise<boolean> => {
		getLogger('materialized-views').trace({
			code: 'MV_040',
			title: 'Context-based conditional refresh called',
			logStats,
			itemsToCheck: Object.keys(items).filter((key) => items[key as keyof typeof items])
		});

		try {
			const result = await materializedViewActions.conditionalRefresh({
				logStats,
				items
			});

			getLogger('materialized-views').trace({
				code: 'MV_041',
				title: 'Context-based conditional refresh completed',
				refreshPerformed: result
			});

			return result;
		} catch (error) {
			getLogger('materialized-views').error({
				code: 'MV_042',
				title: 'Context-based conditional refresh failed',
				logStats,
				itemsToCheck: Object.keys(items).filter((key) => items[key as keyof typeof items]),
				error
			});
			throw error;
		}
	},
	setRefreshRequired: async (): Promise<void> => {
		getLogger('materialized-views').info({
			code: 'MV_050',
			title: 'Setting all materialized views as requiring refresh'
		});

		const context = getContextStore();
		const db = context.global.db;

		try {
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

			context.global.viewRefreshLimiter.updateLastRequest();

			getLogger('materialized-views').debug({
				code: 'MV_051',
				title: 'Successfully set all materialized views as requiring refresh'
			});
		} catch (error) {
			getLogger('materialized-views').error({
				code: 'MV_052',
				title: 'Failed to set materialized views as requiring refresh',
				error
			});
			throw error;
		}
	}
};
