import type {
	CreateCategorySchemaType,
	CategoryFilterSchemaType,
	UpdateCategorySchemaType
} from '$lib/schema/categorySchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { category } from '../schema';
import { SQL, and, asc, desc, eq, ilike, like, not, sql } from 'drizzle-orm';
import { statusUpdate } from './helpers/statusUpdate';
import { combinedTitleSplit, combinedTitleSplitRequired } from '$lib/helpers/combinedTitleSplit';
import { updatedTime } from './helpers/updatedTime';
import type { IdSchemaType } from '$lib/schema/idSchema';
import { logging } from '$lib/server/logging';

export const categoryActions = {
	getById: async (db: DBType, id: string) => {
		return db.query.category.findFirst({ where: eq(category.id, id) }).execute();
	},
	list: async (db: DBType, filter: CategoryFilterSchemaType) => {
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where: SQL<unknown>[] = [];
		if (restFilter.id) where.push(eq(category.id, restFilter.id));
		if (restFilter.title) where.push(like(category.title, `%${restFilter.title}%`));
		if (restFilter.group) where.push(ilike(category.title, `%${restFilter.group}%`));
		if (restFilter.single) where.push(ilike(category.title, `%${restFilter.single}%`));
		if (restFilter.status) where.push(eq(category.status, restFilter.status));
		else where.push(not(eq(category.status, 'deleted')));
		if (restFilter.deleted) where.push(eq(category.deleted, restFilter.deleted));
		if (restFilter.disabled) where.push(eq(category.disabled, restFilter.disabled));
		if (restFilter.allowUpdate) where.push(eq(category.allowUpdate, restFilter.allowUpdate));
		if (restFilter.active) where.push(eq(category.active, restFilter.active));

		const defaultOrderBy = [asc(category.group), asc(category.single), desc(category.createdAt)];

		const orderByResult = orderBy
			? [
					...orderBy.map((currentOrder) =>
						currentOrder.direction === 'asc'
							? asc(category[currentOrder.field])
							: desc(category[currentOrder.field])
					),
					...defaultOrderBy
			  ]
			: defaultOrderBy;

		const results = db.query.category
			.findMany({
				where: and(...where),
				offset: page * pageSize,
				limit: pageSize,
				orderBy: orderByResult
			})
			.execute();

		const resultCount = await db
			.select({ count: sql<number>`count(${category.id})`.mapWith(Number) })
			.from(category)
			.where(and(...where))
			.execute();

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: await results, pageCount, page, pageSize };
	},
	create: async (db: DBType, data: CreateCategorySchemaType) => {
		const id = nanoid();
		await db
			.insert(category)
			.values({
				id,
				...statusUpdate(data.status),
				...updatedTime(),
				...combinedTitleSplitRequired(data)
			})
			.execute();

		return id;
	},
	update: async (db: DBType, data: UpdateCategorySchemaType) => {
		const { id } = data;
		const currentCategory = await db.query.category
			.findFirst({ where: eq(category.id, id) })
			.execute();
		logging.info('Update Category: ', data, currentCategory);

		if (!currentCategory || currentCategory.status === 'deleted') {
			logging.info('Update Category: Category not found or deleted');
			return id;
		}

		if (data.status && data.status === 'deleted') {
			logging.info('Update Category: Cannot Use Update To Set To Deleted');
			return id;
		}

		await db
			.update(category)
			.set({
				...statusUpdate(data.status),
				...updatedTime(),
				...combinedTitleSplit(data)
			})
			.where(eq(category.id, id))
			.execute();

		return id;
	},
	delete: async (db: DBType, data: IdSchemaType) => {
		const currentCategory = await db.query.category
			.findFirst({ where: eq(category.id, data.id), with: { journals: { limit: 1 } } })
			.execute();

		// If the category has no journals, then mark as deleted, otherwise do nothing
		if (currentCategory && currentCategory.journals.length === 0) {
			await db
				.update(category)
				.set({ ...statusUpdate('deleted'), ...updatedTime() })
				.where(eq(category.id, data.id))
				.execute();
		}

		return data.id;
	},
	undelete: async (db: DBType, data: IdSchemaType) => {
		const currentCategory = await db.query.category
			.findFirst({ where: eq(category.id, data.id) })
			.execute();
		if (currentCategory && currentCategory.deleted) {
			await db
				.update(category)
				.set({ ...statusUpdate('active'), ...updatedTime() })
				.where(eq(category.id, data.id))
				.execute();
		}
	}
};
