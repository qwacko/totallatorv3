import type {
	CreateCategorySchemaType,
	CategoryFilterSchemaType,
	UpdateCategorySchemaType
} from '$lib/schema/categorySchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { account, category, journalEntry } from '../schema';
import { and, asc, desc, eq, getTableColumns, inArray, sql } from 'drizzle-orm';
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
			.leftJoin(journalEntry, eq(journalEntry.categoryId, category.id))
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

		const results = await db
			.select({
				...getTableColumns(category),
				sum: sql`sum(CASE WHEN ${account.type} IN ('asset', 'liability') THEN ${journalEntry.amount} ELSE 0 END)`.mapWith(
					Number
				),
				count:
					sql`count(CASE WHEN ${account.type} IN ('asset', 'liability') THEN 1 ELSE NULL END)`.mapWith(
						Number
					),
				firstDate: sql`min(${journalEntry.date})`.mapWith(journalEntry.date),
				lastDate: sql`min(${journalEntry.date})`.mapWith(journalEntry.date)
			})
			.from(category)
			.where(and(...where))
			.limit(pageSize)
			.offset(page * pageSize)
			.orderBy(...orderByResult)
			.leftJoin(journalEntry, eq(journalEntry.categoryId, category.id))
			.leftJoin(account, eq(account.id, journalEntry.accountId))
			.groupBy(category.id)
			.execute();

		const resultCount = await db
			.select({ count: sql<number>`count(${category.id})`.mapWith(Number) })
			.from(category)
			.where(and(...where))
			.execute();

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: results, pageCount, page, pageSize };
	},
	listForDropdown: async ({ db }: { db: DBType }) => {
		const items = db
			.select({
				id: category.id,
				title: category.title,
				group: category.group,
				enabled: category.allowUpdate
			})
			.from(category)
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

		if (!currentCategory) {
			logging.info('Update Category: Category not found');
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
	canDeleteMany: async (db: DBType, ids: string[]) => {
		const canDeleteList = await Promise.all(
			ids.map(async (id) => categoryActions.canDelete(db, { id }))
		);

		return canDeleteList.reduce((prev, current) => (current === false ? false : prev), true);
	},
	canDelete: async (db: DBType, data: IdSchemaType) => {
		const currentCategory = await db.query.category
			.findFirst({ where: eq(category.id, data.id), with: { journals: { limit: 1 } } })
			.execute();
		if (!currentCategory) {
			return true;
		}

		// If the category has no journals, then mark as deleted, otherwise do nothing
		return currentCategory && currentCategory.journals.length === 0;
	},
	delete: async (db: DBType, data: IdSchemaType) => {
		if (await categoryActions.canDelete(db, data)) {
			await db.delete(category).where(eq(category.id, data.id)).execute();
		}

		return data.id;
	},
	deleteMany: async (db: DBType, data: IdSchemaType[]) => {
		if (data.length === 0) return;
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
