import { and, asc, count, desc, eq, isNotNull, max } from 'drizzle-orm';
import { count as drizzleCount } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import Papa from 'papaparse';

import { getContextDB } from '@totallator/context';
import {
	budget,
	type BudgetTableType,
	type BudgetViewReturnType,
	journalEntry
} from '@totallator/database';
import type {
	BudgetFilterSchemaType,
	CreateBudgetSchemaType,
	UpdateBudgetSchemaType
} from '@totallator/shared';

import { getLogger } from '@/logger';
import { dbExecuteLogger } from '@/server/db/dbLogger';

import { streamingDelay } from '../server/testingDelay';
import { accountGetById } from './helpers/account/accountGetById';
import { budgetCreateInsertionData } from './helpers/budget/budgetCreateInsertionData';
import { budgetFilterToQuery } from './helpers/budget/budgetFilterToQuery';
import { getCorrectBudgetTable } from './helpers/budget/getCorrectBudgetTable';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';
import type { ItemActionsType } from './helpers/misc/ItemActionsType';
import { statusUpdate } from './helpers/misc/statusUpdate';
import { updatedTime } from './helpers/misc/updatedTime';
import { createUniqueItemsOnly } from './helpers/seed/createUniqueItemsOnly';
import { createBudget } from './helpers/seed/seedBudgetData';
import { materializedViewActions } from './materializedViewActions';

export type BudgetDropdownType = {
	id: string;
	title: string;
	enabled: boolean;
}[];

type BudgetActionsType = ItemActionsType<
	BudgetTableType,
	BudgetViewReturnType,
	BudgetFilterSchemaType,
	CreateBudgetSchemaType,
	UpdateBudgetSchemaType,
	BudgetDropdownType,
	number
>;

export const budgetActions: BudgetActionsType = {
	latestUpdate: async () => {
		const db = getContextDB();
		const latestUpdate = await dbExecuteLogger(
			db.select({ lastUpdated: max(budget.updatedAt) }).from(budget),
			'Budgets - Latest Update'
		);
		return latestUpdate[0].lastUpdated || new Date();
	},
	getById: async (id) => {
		const db = getContextDB();
		return dbExecuteLogger(
			db.query.budget.findFirst({ where: eq(budget.id, id) }),
			'Budget - Get By Id'
		);
	},
	count: async (filter) => {
		const db = getContextDB();
		const { table, target } = await getCorrectBudgetTable();
		const count = await dbExecuteLogger(
			db
				.select({ count: drizzleCount(table.id) })
				.from(table)
				.where(and(...(filter ? budgetFilterToQuery({ filter, target }) : []))),
			'Budget - Count'
		);

		return count[0].count;
	},
	listWithTransactionCount: async () => {
		const db = getContextDB();
		const { table } = await getCorrectBudgetTable();

		const items = dbExecuteLogger(
			db.select({ id: table.id, journalCount: table.count }).from(table),
			'Budget - List With Transaction Count'
		);

		return items;
	},
	list: async ({ filter }) => {
		const db = getContextDB();
		const { table, target } = await getCorrectBudgetTable();

		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where = budgetFilterToQuery({ filter: restFilter, target });

		const defaultOrderBy = [asc(table.title), desc(table.createdAt)];

		const orderByResult = orderBy
			? [
					...orderBy.map((currentOrder) =>
						currentOrder.direction === 'asc'
							? asc(table[currentOrder.field])
							: desc(table[currentOrder.field])
					),
					...defaultOrderBy
				]
			: defaultOrderBy;

		const results = await dbExecuteLogger(
			db
				.select()
				.from(table)
				.where(and(...where))
				.limit(pageSize)
				.offset(page * pageSize)
				.orderBy(...orderByResult),
			'Budget - List - Results'
		);

		const resultCount = await dbExecuteLogger(
			db
				.select({ count: drizzleCount(table.id) })
				.from(table)
				.where(and(...where)),
			'Budget - List - Count'
		);

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: results, pageCount, page, pageSize };
	},
	listRecommendationsFromPayee: async ({ payeeId }) => {
		const account = await accountGetById(payeeId);
		if (!account || account.isCatchall) {
			return [];
		}

		const db = getContextDB();

		const innerSelect = db
			.select({ id: journalEntry.budgetId })
			.from(journalEntry)
			.where(and(eq(journalEntry.accountId, payeeId), isNotNull(journalEntry.budgetId)))
			.limit(100)
			.as('inner_table');
		const recommendations = await dbExecuteLogger(
			db
				.select({ id: innerSelect.id, title: budget.title, count: count(innerSelect.id) })
				.from(innerSelect)
				.leftJoin(budget, eq(budget.id, innerSelect.id))
				.groupBy(innerSelect.id, budget.title)
				.orderBy((self) => desc(self.count))
				.limit(4),
			'Budgets - List Recommendations From Payee'
		);
		const filteredRecommendation = recommendations
			.filter((item) => item.id)
			.map((item) => ({ ...item, id: item.id || '' }));
		const sortedRecommendations = filteredRecommendation.sort((a, b) => b.count - a.count);
		const totalFound = sortedRecommendations.reduce((acc, item) => acc + item.count, 0);

		return sortedRecommendations.map((item) => {
			return {
				id: item.id,
				title: item.title || '',
				fraction: totalFound > 0 ? item.count / totalFound : 0,
				count: item.count
			};
		});
	},
	generateCSVData: async ({ filter, returnType }) => {
		const data = await budgetActions.list({
			filter: { ...filter, page: 0, pageSize: 100000 }
		});

		const preppedData = data.data.map((item, row) => {
			if (returnType === 'import') {
				return {
					title: item.title,
					status: item.status
				} satisfies CreateBudgetSchemaType;
			}
			return {
				row,
				id: item.id,
				title: item.title,
				status: item.status,
				sum: item.sum,
				count: item.count
			};
		});

		const csvData = Papa.unparse(preppedData);

		return csvData;
	},
	listForDropdown: async () => {
		const db = getContextDB();
		await streamingDelay();
		const items = dbExecuteLogger(
			db
				.select({
					id: budget.id,
					title: budget.title,
					enabled: budget.allowUpdate
				})
				.from(budget),
			'Budget - List For Dropdown'
		);

		return items;
	},
	createOrGet: async ({ title, id, requireActive = true, cachedData }) => {
		const db = getContextDB();

		getLogger('budgets').debug({
			code: 'BUDGET_040',
			title: 'Creating or getting budget',
			budgetId: id,
			budgetTitle: title,
			requireActive,
			usingCache: !!cachedData
		});
		if (id) {
			const currentBudget = cachedData
				? cachedData.find((item) => item.id === id)
				: await dbExecuteLogger(
						db.query.budget.findFirst({ where: eq(budget.id, id) }),
						'Budget - Create Or Get - Get By Id'
					);

			if (currentBudget) {
				if (requireActive && currentBudget.status !== 'active') {
					getLogger('budgets').warn({
						code: 'BUDGET_041',
						title: 'Budget found but not active',
						budgetId: id,
						budgetStatus: currentBudget.status
					});
					throw new Error(`Budget ${currentBudget.title} is not active`);
				}
				getLogger('budgets').debug({
					code: 'BUDGET_042',
					title: 'Found existing budget by ID',
					budgetId: id
				});
				return currentBudget;
			}
			getLogger('budgets').error({
				code: 'BUDGET_043',
				title: 'Budget not found by ID',
				budgetId: id
			});
			throw new Error(`Budget ${id} not found`);
		} else if (title) {
			const currentBudget = cachedData
				? cachedData.find((item) => item.title === title)
				: await dbExecuteLogger(
						db.query.budget.findFirst({ where: eq(budget.title, title) }),
						'Budget - Create Or Get - Get By Title'
					);
			if (currentBudget) {
				if (requireActive && currentBudget.status !== 'active') {
					getLogger('budgets').warn({
						code: 'BUDGET_044',
						title: 'Budget found by title but not active',
						budgetTitle: title,
						budgetStatus: currentBudget.status
					});
					throw new Error(`Budget ${currentBudget.title} is not active`);
				}
				getLogger('budgets').debug({
					code: 'BUDGET_045',
					title: 'Found existing budget by title',
					budgetTitle: title
				});
				return currentBudget;
			}
			getLogger('budgets').info({
				code: 'BUDGET_046',
				title: 'Creating new budget from title',
				budgetTitle: title
			});
			const newBudgetId = await budgetActions.create({
				title,
				status: 'active'
			});
			const newBudget = await dbExecuteLogger(
				db.query.budget.findFirst({ where: eq(budget.id, newBudgetId) }),
				'Budget - Create Or Get - Get By Id'
			);
			if (!newBudget) {
				getLogger('budgets').error({
					code: 'BUDGET_047',
					title: 'Failed to create budget from title',
					budgetTitle: title
				});
				throw new Error('Error Creating Budget');
			}
			getLogger('budgets').info({
				code: 'BUDGET_048',
				title: 'Successfully created budget from title',
				budgetId: newBudgetId,
				budgetTitle: title
			});
			return newBudget;
		} else {
			return undefined;
		}
	},
	create: async (data) => {
		const startTime = Date.now();
		const db = getContextDB();
		const id = nanoid();

		getLogger('budgets').info({
			code: 'BUDGET_010',
			title: 'Creating new budget',
			budgetId: id,
			budgetTitle: data.title,
			status: data.status
		});

		try {
			await dbExecuteLogger(
				db.insert(budget).values(budgetCreateInsertionData(data, id)),
				'Budget - Create'
			);

			await materializedViewActions.setRefreshRequired();

			const duration = Date.now() - startTime;
			getLogger('budgets').info({
				code: 'BUDGET_011',
				title: 'Budget created successfully',
				budgetId: id,
				duration
			});

			return id;
		} catch (e) {
			getLogger('budgets').error({
				code: 'BUDGET_012',
				title: 'Failed to create budget',
				budgetId: id,
				error: e
			});
			throw e;
		}
	},
	createMany: async (data) => {
		const startTime = Date.now();
		const db = getContextDB();

		getLogger('budgets').info({
			code: 'BUDGET_050',
			title: 'Creating multiple budgets',
			count: data.length
		});

		try {
			const items = data.map((item) => {
				const id = nanoid();
				return budgetCreateInsertionData(item, id);
			});
			const ids = items.map((item) => item.id);
			await dbExecuteLogger(db.insert(budget).values(items), 'Budget - Create Many');
			await materializedViewActions.setRefreshRequired();

			const duration = Date.now() - startTime;
			getLogger('budgets').info({
				code: 'BUDGET_051',
				title: 'Successfully created multiple budgets',
				count: data.length,
				duration
			});

			return ids;
		} catch (e) {
			getLogger('budgets').error({
				code: 'BUDGET_052',
				title: 'Failed to create multiple budgets',
				count: data.length,
				error: e
			});
			throw e;
		}
	},
	update: async ({ data, id }) => {
		const startTime = Date.now();
		const db = getContextDB();

		getLogger('budgets').debug({
			code: 'BUDGET_020',
			title: 'Starting budget update',
			budgetId: id,
			updateFields: Object.keys(data)
		});

		const currentBudget = await dbExecuteLogger(
			db.query.budget.findFirst({ where: eq(budget.id, id) }),
			'Budget - Update - Find'
		);

		if (!currentBudget) {
			getLogger('budgets').error({
				code: 'BUDGET_021',
				title: 'Budget not found for update',
				budgetId: id
			});
			return id;
		}

		try {
			await dbExecuteLogger(
				db
					.update(budget)
					.set({
						...statusUpdate(data.status),
						...updatedTime(),
						title: data.title
					})
					.where(eq(budget.id, id)),
				'Budget - Update'
			);

			await materializedViewActions.setRefreshRequired();

			const duration = Date.now() - startTime;
			getLogger('budgets').info({
				code: 'BUDGET_022',
				title: 'Budget updated successfully',
				budgetId: id,
				duration
			});

			return id;
		} catch (e) {
			getLogger('budgets').error({
				code: 'BUDGET_023',
				title: 'Failed to update budget',
				budgetId: id,
				error: e
			});
			throw e;
		}
	},
	canDeleteMany: async (ids) => {
		const canDeleteList = await Promise.all(ids.map(async (id) => budgetActions.canDelete({ id })));

		return canDeleteList.reduce((prev, current) => (current === false ? false : prev), true);
	},
	canDelete: async (data) => {
		const db = getContextDB();
		const currentBudget = await dbExecuteLogger(
			db.query.budget.findFirst({
				where: eq(budget.id, data.id),
				with: { journals: { limit: 1 } }
			}),
			'Budget - Can Delete - Find First'
		);
		if (!currentBudget) {
			return true;
		}

		// If the budget has no journals, then mark as deleted, otherwise do nothing
		return currentBudget && currentBudget.journals.length === 0;
	},
	delete: async (data) => {
		const db = getContextDB();

		getLogger('budgets').info({
			code: 'BUDGET_030',
			title: 'Attempting to delete budget',
			budgetId: data.id
		});

		// If the budget has no journals, then mark as deleted, otherwise do nothing
		if (await budgetActions.canDelete(data)) {
			await dbExecuteLogger(db.delete(budget).where(eq(budget.id, data.id)), 'Budget - Delete');
			getLogger('budgets').info({
				code: 'BUDGET_031',
				title: 'Budget deleted successfully',
				budgetId: data.id
			});
		} else {
			getLogger('budgets').warn({
				code: 'BUDGET_032',
				title: 'Budget cannot be deleted - has journal entries',
				budgetId: data.id
			});
		}

		await materializedViewActions.setRefreshRequired();

		return data.id;
	},
	deleteMany: async (data) => {
		const db = getContextDB();
		if (data.length === 0) {
			getLogger('budgets').debug({
				code: 'BUDGET_060',
				title: 'Delete many budgets called with empty array'
			});
			return;
		}

		getLogger('budgets').info({
			code: 'BUDGET_061',
			title: 'Attempting to delete multiple budgets',
			count: data.length,
			budgetIds: data.map((item) => item.id)
		});

		const currentBudgets = await budgetActions.listWithTransactionCount();
		const itemsForDeletion = data.filter((item) => {
			const currentBudget = currentBudgets.find((current) => current.id === item.id);
			return currentBudget && currentBudget.journalCount === 0;
		});

		if (itemsForDeletion.length === data.length) {
			await dbExecuteLogger(
				db.delete(budget).where(
					inArrayWrapped(
						budget.id,
						itemsForDeletion.map((item) => item.id)
					)
				),
				'Budget - Delete Many'
			);
			getLogger('budgets').info({
				code: 'BUDGET_062',
				title: 'Successfully deleted multiple budgets',
				count: itemsForDeletion.length
			});
			await materializedViewActions.setRefreshRequired();
			return true;
		} else {
			getLogger('budgets').warn({
				code: 'BUDGET_063',
				title: 'Cannot delete all budgets - some have journal entries',
				requested: data.length,
				eligible: itemsForDeletion.length
			});
			return false;
		}
	},
	seed: async (count) => {
		const db = getContextDB();
		getLogger('budgets').info({
			code: 'BUDGET_070',
			title: 'Seeding Budgets',
			count
		});

		try {
			const existingTitles = (
				await dbExecuteLogger(
					db.query.budget.findMany({ columns: { title: true } }),
					'Budget - Seed - Get Existing'
				)
			).map((item) => item.title);
			const itemsToCreate = createUniqueItemsOnly({
				existing: existingTitles,
				creationToString: (creation) => creation.title,
				createItem: createBudget,
				count
			});

			getLogger('budgets').debug({
				code: 'BUDGET_071',
				title: 'Creating unique budgets for seeding',
				existing: existingTitles.length,
				toCreate: itemsToCreate.length
			});

			await budgetActions.createMany(itemsToCreate);

			getLogger('budgets').info({
				code: 'BUDGET_072',
				title: 'Budgets seeded successfully',
				count: itemsToCreate.length
			});
		} catch (e) {
			getLogger('budgets').error({
				code: 'BUDGET_073',
				title: 'Failed to seed budgets',
				count,
				error: e
			});
			throw e;
		}
	}
};
