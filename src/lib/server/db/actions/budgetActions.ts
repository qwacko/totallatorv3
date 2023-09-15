import type {
	CreateBudgetSchemaType,
	BudgetFilterSchemaType,
	UpdateBudgetSchemaType
} from '$lib/schema/budgetSchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { budget } from '../schema';
import { SQL, and, asc, desc, eq, like, not, sql } from 'drizzle-orm';
import { statusUpdate } from './helpers/statusUpdate';
import { updatedTime } from './helpers/updatedTime';
import type { IdSchemaType } from '$lib/schema/idSchema';
import { logging } from '$lib/server/logging';

export const budgetActions = {
	getById: async (db: DBType, id: string) => {
		return db.query.budget.findFirst({ where: eq(budget.id, id) }).execute();
	},
	list: async (db: DBType, filter: BudgetFilterSchemaType) => {
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where: SQL<unknown>[] = [];
		if (restFilter.id) where.push(eq(budget.id, restFilter.id));
		if (restFilter.title) where.push(like(budget.title, `%${restFilter.title}%`));
		if (restFilter.status) where.push(eq(budget.status, restFilter.status));
		else where.push(not(eq(budget.status, 'deleted')));
		if (restFilter.deleted) where.push(eq(budget.deleted, restFilter.deleted));
		if (restFilter.disabled) where.push(eq(budget.disabled, restFilter.disabled));
		if (restFilter.allowUpdate) where.push(eq(budget.allowUpdate, restFilter.allowUpdate));
		if (restFilter.active) where.push(eq(budget.active, restFilter.active));

		const defaultOrderBy = [asc(budget.title), desc(budget.createdAt)];

		const orderByResult = orderBy
			? [
					...orderBy.map((currentOrder) =>
						currentOrder.direction === 'asc'
							? asc(budget[currentOrder.field])
							: desc(budget[currentOrder.field])
					),
					...defaultOrderBy
			  ]
			: defaultOrderBy;

		const results = db.query.budget
			.findMany({
				where: and(...where),
				offset: page * pageSize,
				limit: pageSize,
				orderBy: orderByResult
			})
			.execute();

		const resultCount = await db
			.select({ count: sql<number>`count(${budget.id})`.mapWith(Number) })
			.from(budget)
			.where(and(...where))
			.execute();

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: await results, pageCount, page, pageSize };
	},
	create: async (db: DBType, data: CreateBudgetSchemaType) => {
		const id = nanoid();
		await db
			.insert(budget)
			.values({
				id,
				...statusUpdate(data.status),
				...updatedTime(),
				title: data.title
			})
			.execute();

		return id;
	},
	update: async (db: DBType, data: UpdateBudgetSchemaType) => {
		const { id } = data;
		const currentBudget = await db.query.budget.findFirst({ where: eq(budget.id, id) }).execute();
		logging.info('Update Budget: ', data, currentBudget);

		if (!currentBudget || currentBudget.status === 'deleted') {
			logging.info('Update Budget: Budget not found or deleted');
			return id;
		}

		if (data.status && data.status === 'deleted') {
			logging.info('Update Budget: Cannot Use Update To Set To Deleted');
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
	delete: async (db: DBType, data: IdSchemaType) => {
		const currentBudget = await db.query.budget
			.findFirst({ where: eq(budget.id, data.id), with: { journals: { limit: 1 } } })
			.execute();

		// If the budget has no journals, then mark as deleted, otherwise do nothing
		if (currentBudget && currentBudget.journals.length === 0) {
			await db
				.update(budget)
				.set({ ...statusUpdate('deleted'), ...updatedTime() })
				.where(eq(budget.id, data.id))
				.execute();
		}

		return data.id;
	},
	undelete: async (db: DBType, data: IdSchemaType) => {
		const currentBudget = await db.query.budget
			.findFirst({ where: eq(budget.id, data.id) })
			.execute();
		if (currentBudget && currentBudget.deleted) {
			await db
				.update(budget)
				.set({ ...statusUpdate('active'), ...updatedTime() })
				.where(eq(budget.id, data.id))
				.execute();
		}
	}
};
