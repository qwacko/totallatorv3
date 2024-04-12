import { eq } from 'drizzle-orm';
import type { DBType } from '../db';
import { reusableFilter } from '../postgres/schema';
import {
	journalExtendedView,
	accountMaterializedView,
	tagMaterializedView,
	billMaterializedView,
	budgetMaterializedView,
	categoryMaterializedView,
	labelMaterializedView,
	dateRangeMaterializedView
} from '../postgres/schema/materializedViewSchema';

import { booleanKeyValueStore } from './helpers/keyValueStore';
import { logging } from '$lib/server/logging';

const refreshRequiredStore = booleanKeyValueStore('journalExtendedViewRefresh', true);
const accountRefreshRequiredStore = booleanKeyValueStore('accountViewRefresh', true);
const tagRefreshRequiredStore = booleanKeyValueStore('tagViewRefresh', true);
const billRefreshRequiredStore = booleanKeyValueStore('billViewRefresh', true);
const budgetRefreshRequiredStore = booleanKeyValueStore('budgetViewRefresh', true);
const categoryRefreshRequiredStore = booleanKeyValueStore('categoryViewRefresh', true);
const labelRefreshRequiredStore = booleanKeyValueStore('labelViewRefresh', true);
const dateTimeRefreshRequiredStore = booleanKeyValueStore('dateTimeViewRefresh', true);

const logRefreshTime = false;

const timePromise = async <T>(title: string, enable: boolean | undefined, fn: () => Promise<T>) => {
	if (!enable) return;
	const startTime = Date.now();
	const result = await fn();
	const endTime = Date.now();

	if (logRefreshTime) {
		logging.debug(`${title} took ${endTime - startTime}ms`);
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
};

const itemsDefault = {
	journals: true,
	account: true,
	tag: true,
	bill: true,
	budget: true,
	category: true,
	label: true
};

export const materializedViewActions = {
	refresh: async ({
		db,
		items = itemsDefault
	}: {
		db: DBType;
		logStats?: boolean;
		items?: itemsType;
	}) => {
		await Promise.all([
			timePromise('Journal Extended View Refresh', items.journals, async () => {
				await db.refreshMaterializedView(journalExtendedView);
				await refreshRequiredStore.set(db, false);
			}),
			timePromise('Account View Refresh', items.account, async () => {
				await db.refreshMaterializedView(accountMaterializedView);
				await accountRefreshRequiredStore.set(db, false);
			}),
			timePromise('Tag View Refresh', items.tag, async () => {
				await db.refreshMaterializedView(tagMaterializedView);
				await tagRefreshRequiredStore.set(db, false);
			}),
			timePromise('Bill View Refresh', items.bill, async () => {
				await db.refreshMaterializedView(billMaterializedView);
				await billRefreshRequiredStore.set(db, false);
			}),
			timePromise('Budget View Refresh', items.budget, async () => {
				await db.refreshMaterializedView(budgetMaterializedView);
				await budgetRefreshRequiredStore.set(db, false);
			}),
			timePromise('Category View Refresh', items.category, async () => {
				await db.refreshMaterializedView(categoryMaterializedView);
				await categoryRefreshRequiredStore.set(db, false);
			}),
			timePromise('Label View Refresh', items.label, async () => {
				await db.refreshMaterializedView(labelMaterializedView);
				await labelRefreshRequiredStore.set(db, false);
			}),
			timePromise('Date Time View Refresh', items.label, async () => {
				await db.refreshMaterializedView(dateRangeMaterializedView);
				await dateTimeRefreshRequiredStore.set(db, false);
			})
		]);
	},
	conditionalRefresh: async ({
		db,
		logStats = false,
		items = itemsDefault
	}: {
		db: DBType;
		logStats?: boolean;
		items?: itemsType;
	}) => {
		const itemsRequiringUpdate = {
			account: await accountRefreshRequiredStore.get(db),
			tag: await tagRefreshRequiredStore.get(db),
			bill: await billRefreshRequiredStore.get(db),
			budget: await budgetRefreshRequiredStore.get(db),
			category: await categoryRefreshRequiredStore.get(db),
			label: await labelRefreshRequiredStore.get(db),
			journals: await refreshRequiredStore.get(db)
		};

		const needsUpdate = Object.keys(items).some(
			(key) => itemsRequiringUpdate[key as any as keyof typeof itemsRequiringUpdate]
		);

		if (!needsUpdate) return false;

		await materializedViewActions.refresh({ db, logStats, items });
		return true;
	},
	setRefreshRequired: async (db: DBType) => {
		await Promise.all([
			refreshRequiredStore.set(db, true),
			accountRefreshRequiredStore.set(db, true),
			tagRefreshRequiredStore.set(db, true),
			billRefreshRequiredStore.set(db, true),
			budgetRefreshRequiredStore.set(db, true),
			categoryRefreshRequiredStore.set(db, true),
			labelRefreshRequiredStore.set(db, true),
			dateTimeRefreshRequiredStore.set(db, true),
			db
				.update(reusableFilter)
				.set({ needsUpdate: true })
				.where(eq(reusableFilter.needsUpdate, false))
				.execute()
		]);
	}
};
