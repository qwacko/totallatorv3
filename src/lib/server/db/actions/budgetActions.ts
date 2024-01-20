import type {
	CreateBudgetSchemaType,
	BudgetFilterSchemaType,
	UpdateBudgetSchemaType
} from '$lib/schema/budgetSchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { budget } from '../postgres/schema';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { statusUpdate } from './helpers/misc/statusUpdate';
import { updatedTime } from './helpers/misc/updatedTime';
import type { IdSchemaType } from '$lib/schema/idSchema';
import { logging } from '$lib/server/logging';
import { budgetCreateInsertionData } from './helpers/budget/budgetCreateInsertionData';
import { budgetFilterToQuery } from './helpers/budget/budgetFilterToQuery';
import { createBudget } from './helpers/seed/seedBudgetData';
import { createUniqueItemsOnly } from './helpers/seed/createUniqueItemsOnly';
import { streamingDelay } from '$lib/server/testingDelay';
import { count as drizzleCount } from 'drizzle-orm';
import type { StatusEnumType } from '$lib/schema/statusSchema';
import { materializedViewActions } from './materializedViewActions';
import { budgetMaterializedView } from '../postgres/schema/materializedViewSchema';

export const budgetActions = {
	getById: async (db: DBType, id: string) => {
		return db.query.budget.findFirst({ where: eq(budget.id, id) }).execute();
	},
	count: async (db: DBType, filter?: BudgetFilterSchemaType) => {
		await materializedViewActions.conditionalRefresh({ db });
		const count = await db
			.select({ count: drizzleCount(budgetMaterializedView.id) })
			.from(budgetMaterializedView)
			.where(and(...(filter ? budgetFilterToQuery({ filter, target: 'budget' }) : [])))
			.execute();

		return count[0].count;
	},
	listWithTransactionCount: async (db: DBType) => {
		await materializedViewActions.conditionalRefresh({ db });

		const items = db
			.select({ id: budgetMaterializedView.id, journalCount: budgetMaterializedView.count })
			.from(budgetMaterializedView)
			.execute();

		return items;
	},
	list: async ({ db, filter }: { db: DBType; filter: BudgetFilterSchemaType }) => {
		await materializedViewActions.conditionalRefresh({ db });

		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where = budgetFilterToQuery({ filter: restFilter, target: 'budgetWithSummary' });

		const defaultOrderBy = [
			asc(budgetMaterializedView.title),
			desc(budgetMaterializedView.createdAt)
		];

		const orderByResult = orderBy
			? [
					...orderBy.map((currentOrder) =>
						currentOrder.direction === 'asc'
							? asc(budgetMaterializedView[currentOrder.field])
							: desc(budgetMaterializedView[currentOrder.field])
					),
					...defaultOrderBy
				]
			: defaultOrderBy;

		const results = await db
			.select()
			.from(budgetMaterializedView)
			.where(and(...where))
			.limit(pageSize)
			.offset(page * pageSize)
			.orderBy(...orderByResult)
			.execute();

		const resultCount = await db
			.select({ count: drizzleCount(budgetMaterializedView.id) })
			.from(budgetMaterializedView)
			.where(and(...where))
			.execute();

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: results, pageCount, page, pageSize };
	},
	listForDropdown: async ({ db }: { db: DBType }) => {
		await streamingDelay();
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
		requireActive = true,
		cachedData
	}: {
		db: DBType;
		title?: string | null;
		id?: string | null;
		requireActive?: boolean;
		cachedData?: { id: string; title: string; status: StatusEnumType }[];
	}) => {
		if (id) {
			const currentBudget = cachedData
				? cachedData.find((item) => item.id === id)
				: await db.query.budget.findFirst({ where: eq(budget.id, id) }).execute();

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
				: await db.query.budget.findFirst({ where: eq(budget.title, title) }).execute();
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
		await db.insert(budget).values(budgetCreateInsertionData(data, id)).execute();

		await materializedViewActions.setRefreshRequired(db);

		return id;
	},
	createMany: async (db: DBType, data: CreateBudgetSchemaType[]) => {
		const items = data.map((item) => {
			const id = nanoid();
			return budgetCreateInsertionData(item, id);
		});
		await db.insert(budget).values(items).execute();
		await materializedViewActions.setRefreshRequired(db);
	},
	update: async (db: DBType, data: UpdateBudgetSchemaType) => {
		const { id } = data;
		const currentBudget = await db.query.budget.findFirst({ where: eq(budget.id, id) }).execute();

		if (!currentBudget) {
			logging.error('Update Budget: Budget not found', data);
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

		await materializedViewActions.setRefreshRequired(db);

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
		await materializedViewActions.setRefreshRequired(db);

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
			await materializedViewActions.setRefreshRequired(db);
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
