import type {
	CreateBudgetSchemaType,
	BudgetFilterSchemaType,
	UpdateBudgetSchemaType
} from '$lib/schema/budgetSchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { account, budget, journalEntry, summaryTable } from '../schema';
import { and, asc, desc, eq, getTableColumns, inArray, sql } from 'drizzle-orm';
import { statusUpdate } from './helpers/misc/statusUpdate';
import { updatedTime } from './helpers/misc/updatedTime';
import type { IdSchemaType } from '$lib/schema/idSchema';
import { logging } from '$lib/server/logging';
import { budgetCreateInsertionData } from './helpers/budget/budgetCreateInsertionData';
import { budgetFilterToQuery } from './helpers/budget/budgetFilterToQuery';
import { createBudget } from './helpers/seed/seedBudgetData';
import { createUniqueItemsOnly } from './helpers/seed/createUniqueItemsOnly';
import { summaryActions, summaryTableColumnsToSelect } from './summaryActions';
import { summaryOrderBy } from './helpers/summary/summaryOrderBy';
import { testingDelay } from '$lib/server/testingDelay';

export const budgetActions = {
	getById: async (db: DBType, id: string) => {
		return db.query.budget.findFirst({ where: eq(budget.id, id) }).execute();
	},
	count: async (db: DBType, filter?: BudgetFilterSchemaType) => {
		const count = await db
			.select({ count: sql<number>`count(${budget.id})`.mapWith(Number) })
			.from(budget)
			.where(and(...(filter ? budgetFilterToQuery(filter) : [])))
			.execute();

		return count[0].count;
	},
	listWithTransactionCount: async (db: DBType) => {
		const items = db
			.select({ id: budget.id, journalCount: sql<number>`count(${journalEntry.id})` })
			.from(budget)
			.leftJoin(journalEntry, eq(journalEntry.budgetId, budget.id))
			.groupBy(budget.id)
			.execute();

		return items;
	},
	list: async ({ db, filter }: { db: DBType; filter: BudgetFilterSchemaType }) => {
		await summaryActions.updateAndCreateMany({
			db,
			ids: undefined,
			needsUpdateOnly: true,
			allowCreation: true
		});
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where = budgetFilterToQuery(restFilter, true);

		const defaultOrderBy = [asc(budget.title), desc(budget.createdAt)];

		const orderByResult = orderBy
			? [
					...orderBy.map((currentOrder) =>
						summaryOrderBy(currentOrder, (remainingOrder) => {
							return remainingOrder.direction === 'asc'
								? asc(budget[remainingOrder.field])
								: desc(budget[remainingOrder.field]);
						})
					),
					...defaultOrderBy
			  ]
			: defaultOrderBy;

		const results = await db
			.select({
				...getTableColumns(budget),
				...summaryTableColumnsToSelect
			})
			.from(budget)
			.where(and(...where))
			.limit(pageSize)
			.offset(page * pageSize)
			.orderBy(...orderByResult)
			.leftJoin(journalEntry, eq(journalEntry.budgetId, budget.id))
			.leftJoin(account, eq(account.id, journalEntry.accountId))
			.leftJoin(summaryTable, eq(summaryTable.relationId, budget.id))
			.groupBy(budget.id)
			.execute();

		const resultCount = await db
			.select({ count: sql<number>`count(${budget.id})`.mapWith(Number) })
			.from(budget)
			.where(and(...where))
			.execute();

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: results, pageCount, page, pageSize };
	},
	listForDropdown: async ({ db }: { db: DBType }) => {
		await testingDelay();
		const items = db
			.select({ id: budget.id, title: budget.title, enabled: budget.allowUpdate })
			.from(budget)
			.execute();

		return items;
	},
	createOrGet: async ({
		db,
		title,
		id,
		requireActive = true
	}: {
		db: DBType;
		title?: string | null;
		id?: string | null;
		requireActive?: boolean;
	}) => {
		if (id) {
			const currentBudget = await db.query.budget.findFirst({ where: eq(budget.id, id) }).execute();

			if (currentBudget) {
				if (requireActive && currentBudget.status !== 'active') {
					throw new Error(`Budget ${currentBudget.title} is not active`);
				}
				return currentBudget;
			}
			throw new Error(`Budget ${id} not found`);
		} else if (title) {
			const currentBudget = await db.query.budget
				.findFirst({ where: eq(budget.title, title) })
				.execute();
			if (currentBudget) {
				if (requireActive && currentBudget.status !== 'active') {
					throw new Error(`Budget ${currentBudget.title} is not active`);
				}
				return currentBudget;
			}
			const newBudgetId = await budgetActions.create(db, {
				title,
				status: 'active'
			});
			const newBudget = await db.query.budget
				.findFirst({ where: eq(budget.id, newBudgetId) })
				.execute();
			if (!newBudget) {
				throw new Error('Error Creating Budget');
			}
			return newBudget;
		} else {
			return undefined;
		}
	},
	create: async (db: DBType, data: CreateBudgetSchemaType) => {
		const id = nanoid();
		await db.transaction(async (db) => {
			await db.insert(budget).values(budgetCreateInsertionData(data, id)).execute();
			await summaryActions.createMissing({ db });
		});

		return id;
	},
	createMany: async (db: DBType, data: CreateBudgetSchemaType[]) => {
		const items = data.map((item) => {
			const id = nanoid();
			return budgetCreateInsertionData(item, id);
		});
		await db.transaction(async (db) => {
			await db.insert(budget).values(items).execute();
			await summaryActions.createMissing({ db });
		});
	},
	update: async (db: DBType, data: UpdateBudgetSchemaType) => {
		const { id } = data;
		const currentBudget = await db.query.budget.findFirst({ where: eq(budget.id, id) }).execute();
		logging.info('Update Budget: ', data, currentBudget);

		if (!currentBudget) {
			logging.info('Update Budget: Budget not found');
			return id;
		}

		await db
			.update(budget)
			.set({
				...statusUpdate(data.status),
				...updatedTime(),
				title: data.title
			})
			.where(eq(budget.id, id))
			.execute();

		return id;
	},
	canDeleteMany: async (db: DBType, ids: string[]) => {
		const canDeleteList = await Promise.all(
			ids.map(async (id) => budgetActions.canDelete(db, { id }))
		);

		return canDeleteList.reduce((prev, current) => (current === false ? false : prev), true);
	},
	canDelete: async (db: DBType, data: IdSchemaType) => {
		const currentBudget = await db.query.budget
			.findFirst({ where: eq(budget.id, data.id), with: { journals: { limit: 1 } } })
			.execute();
		if (!currentBudget) {
			return true;
		}

		// If the budget has no journals, then mark as deleted, otherwise do nothing
		return currentBudget && currentBudget.journals.length === 0;
	},
	delete: async (db: DBType, data: IdSchemaType) => {
		if (await budgetActions.canDelete(db, data)) {
			await db.delete(budget).where(eq(budget.id, data.id)).execute();
		}

		return data.id;
	},
	deleteMany: async (db: DBType, data: IdSchemaType[]) => {
		if (data.length === 0) return;
		const currentBudgets = await budgetActions.listWithTransactionCount(db);
		const itemsForDeletion = data.filter((item) => {
			const currentBudget = currentBudgets.find((current) => current.id === item.id);
			return currentBudget && currentBudget.journalCount === 0;
		});

		if (itemsForDeletion.length === data.length) {
			await db
				.delete(budget)
				.where(
					inArray(
						budget.id,
						itemsForDeletion.map((item) => item.id)
					)
				)
				.execute();
		}
	},
	seed: async (db: DBType, count: number) => {
		logging.info('Seeding Budgets : ', count);

		const existingTitles = (
			await db.query.budget.findMany({ columns: { title: true } }).execute()
		).map((item) => item.title);
		const itemsToCreate = createUniqueItemsOnly({
			existing: existingTitles,
			creationToString: (creation) => creation.title,
			createItem: createBudget,
			count
		});

		await budgetActions.createMany(db, itemsToCreate);
	}
};
