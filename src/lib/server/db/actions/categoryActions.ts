import type {
	CreateCategorySchemaType,
	CategoryFilterSchemaType,
	UpdateCategorySchemaType
} from '$lib/schema/categorySchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { category, journalEntry } from '../schema';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { statusUpdate } from './helpers/statusUpdate';
import { combinedTitleSplit } from '$lib/helpers/combinedTitleSplit';
import { updatedTime } from './helpers/updatedTime';
import type { IdSchemaType } from '$lib/schema/idSchema';
import { logging } from '$lib/server/logging';
import { categoryFilterToQuery } from './helpers/categoryFilterToQuery';
import { categoryCreateInsertionData } from './helpers/categoryCreateInsertionData';
import { createCategory } from './helpers/seedCategoryData';
import { createUniqueItemsOnly } from './helpers/createUniqueItemsOnly';

export const categoryActions = {
	getById: async (db: DBType, id: string) => {
		return db.query.category.findFirst({ where: eq(category.id, id) }).execute();
	},
	count: async (db: DBType, filter?: CategoryFilterSchemaType) => {
		const count = await db
			.select({ count: sql<number>`count(${category.id})`.mapWith(Number) })
			.from(category)
			.where(and(...(filter ? categoryFilterToQuery(filter) : [])))
			.execute();

		return count[0].count;
	},
	listWithTransactionCount: async (db: DBType) => {
		const items = db
			.select({ id: category.id, journalCount: sql<number>`count(${journalEntry.id})` })
			.from(category)
			.leftJoin(journalEntry, eq(journalEntry.accountId, category.id))
			.groupBy(category.id)
			.execute();

		return items;
	},
	list: async ({ db, filter }: { db: DBType; filter: CategoryFilterSchemaType }) => {
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where = categoryFilterToQuery(restFilter);

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
	createOrGet: async ({
		db,
		title,
		id,
		requireActive = true
	}: {
		db: DBType;
		title?: string;
		id?: string;
		requireActive?: boolean;
	}) => {
		if (id) {
			const currentCategory = await db.query.category
				.findFirst({ where: eq(category.id, id) })
				.execute();

			if (currentCategory) {
				if (requireActive && currentCategory.status !== 'active') {
					throw new Error(`Category ${currentCategory.title} is not active`);
				}
				return currentCategory;
			}
			throw new Error(`Category ${id} not found`);
		} else if (title) {
			const currentCategory = await db.query.category
				.findFirst({ where: eq(category.title, title) })
				.execute();
			if (currentCategory) {
				if (requireActive && currentCategory.status !== 'active') {
					throw new Error(`Category ${currentCategory.title} is not active`);
				}
				return currentCategory;
			}
			const newCategoryId = await categoryActions.create(db, {
				title,
				status: 'active'
			});
			const newCategory = await db.query.category
				.findFirst({ where: eq(category.id, newCategoryId) })
				.execute();
			if (!newCategory) {
				throw new Error('Error Creating Category');
			}
			return newCategory;
		} else {
			return undefined;
		}
	},
	create: async (db: DBType, data: CreateCategorySchemaType) => {
		const id = nanoid();
		await db.insert(category).values(categoryCreateInsertionData(data, id)).execute();

		return id;
	},
	createMany: async (db: DBType, data: CreateCategorySchemaType[]) => {
		const ids = data.map(() => nanoid());
		const insertData = data.map((currentData, index) =>
			categoryCreateInsertionData(currentData, ids[index])
		);
		await db.insert(category).values(insertData).execute();

		return ids;
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
	deleteMany: async (db: DBType, data: IdSchemaType[]) => {
		const currentCategories = await categoryActions.listWithTransactionCount(db);
		const itemsForDeletion = data.filter((item) => {
			const currentCategory = currentCategories.find((current) => current.id === item.id);
			return currentCategory && currentCategory.journalCount === 0;
		});
		if (itemsForDeletion.length === data.length) {
			await db
				.delete(category)
				.where(
					inArray(
						category.id,
						itemsForDeletion.map((item) => item.id)
					)
				)
				.execute();
			return true;
		}
		return false;
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
	},
	seed: async (db: DBType, count: number) => {
		logging.info('Seeding Categories : ', count);

		const existingTitles = (
			await db.query.category.findMany({ columns: { title: true } }).execute()
		).map((item) => item.title);
		const itemsToCreate = createUniqueItemsOnly({
			existing: existingTitles,
			creationToString: (creation) => creation.title,
			createItem: createCategory,
			count
		});

		await categoryActions.createMany(db, itemsToCreate);
	}
};
