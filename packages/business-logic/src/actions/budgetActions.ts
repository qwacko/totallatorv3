import type {
	CreateBudgetSchemaType,
	BudgetFilterSchemaType,
	UpdateBudgetSchemaType
} from '@totallator/shared';
import { nanoid } from 'nanoid';
import { budget, type BudgetTableType, type BudgetViewReturnType } from '@totallator/database';
import { and, asc, desc, eq, max } from 'drizzle-orm';
import { statusUpdate } from './helpers/misc/statusUpdate';
import { updatedTime } from './helpers/misc/updatedTime';
import { getLogger } from '@/logger';
import { budgetCreateInsertionData } from './helpers/budget/budgetCreateInsertionData';
import { budgetFilterToQuery } from './helpers/budget/budgetFilterToQuery';
import { createBudget } from './helpers/seed/seedBudgetData';
import { createUniqueItemsOnly } from './helpers/seed/createUniqueItemsOnly';
import { streamingDelay } from '../server/testingDelay';
import { count as drizzleCount } from 'drizzle-orm';
import { materializedViewActions } from './materializedViewActions';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';
import { dbExecuteLogger } from '@/server/db/dbLogger';
import { getCorrectBudgetTable } from './helpers/budget/getCorrectBudgetTable';
import type { ItemActionsType } from './helpers/misc/ItemActionsType';
import Papa from 'papaparse';
import { getContextDB } from '@totallator/context';

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
			db.select({ id: budget.id, title: budget.title, enabled: budget.allowUpdate }).from(budget),
			'Budget - List For Dropdown'
		);

		return items;
	},
	createOrGet: async ({ title, id, requireActive = true, cachedData }) => {
		const db = getContextDB();
		if (id) {
			const currentBudget = cachedData
				? cachedData.find((item) => item.id === id)
				: await dbExecuteLogger(
						db.query.budget.findFirst({ where: eq(budget.id, id) }),
						'Budget - Create Or Get - Get By Id'
					);

			if (currentBudget) {
				if (requireActive && currentBudget.status !== 'active') {
					throw new Error(`Budget ${currentBudget.title} is not active`);
				}
				return currentBudget;
			}
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
					throw new Error(`Budget ${currentBudget.title} is not active`);
				}
				return currentBudget;
			}
			const newBudgetId = await budgetActions.create({
				title,
				status: 'active'
			});
			const newBudget = await dbExecuteLogger(
				db.query.budget.findFirst({ where: eq(budget.id, newBudgetId) }),
				'Budget - Create Or Get - Get By Id'
			);
			if (!newBudget) {
				throw new Error('Error Creating Budget');
			}
			return newBudget;
		} else {
			return undefined;
		}
	},
	create: async (data) => {
		const db = getContextDB();
		const id = nanoid();
		await dbExecuteLogger(
			db.insert(budget).values(budgetCreateInsertionData(data, id)),
			'Budget - Create'
		);

		await materializedViewActions.setRefreshRequired();

		return id;
	},
	createMany: async (data) => {
		const db = getContextDB();
		const items = data.map((item) => {
			const id = nanoid();
			return budgetCreateInsertionData(item, id);
		});
		const ids = items.map((item) => item.id);
		await dbExecuteLogger(db.insert(budget).values(items), 'Budget - Create Many');
		await materializedViewActions.setRefreshRequired();
		return ids;
	},
	update: async ({ data, id }) => {
		const db = getContextDB();
		const currentBudget = await dbExecuteLogger(
			db.query.budget.findFirst({ where: eq(budget.id, id) }),
			'Budget - Update - Find'
		);

		if (!currentBudget) {
			getLogger('budgets').error(data, 'Update Budget: Budget not found');
			return id;
		}

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

		return id;
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
		if (await budgetActions.canDelete(data)) {
			await dbExecuteLogger(db.delete(budget).where(eq(budget.id, data.id)), 'Budget - Delete');
		}
		await materializedViewActions.setRefreshRequired();

		return data.id;
	},
	deleteMany: async (data) => {
		const db = getContextDB();
		if (data.length === 0) return;
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
			await materializedViewActions.setRefreshRequired();
			return true;
		}
		return false;
	},
	seed: async (count) => {
		const db = getContextDB();
		getLogger('budgets').info(count, 'Seeding Budgets');

		const existingTitles = (
			await dbExecuteLogger(db.query.budget.findMany({ columns: { title: true } }), 'Budget - Seed')
		).map((item) => item.title);
		const itemsToCreate = createUniqueItemsOnly({
			existing: existingTitles,
			creationToString: (creation) => creation.title,
			createItem: createBudget,
			count
		});

		await budgetActions.createMany(itemsToCreate);
	}
};
