import type {
	CreateCategorySchemaType,
	CategoryFilterSchemaType,
	UpdateCategorySchemaType
} from '$lib/schema/categorySchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { category } from '../postgres/schema';
import { and, asc, desc, eq, } from 'drizzle-orm';
import { statusUpdate } from './helpers/misc/statusUpdate';
import { combinedTitleSplit } from '$lib/helpers/combinedTitleSplit';
import { updatedTime } from './helpers/misc/updatedTime';
import type { IdSchemaType } from '$lib/schema/idSchema';
import { logging } from '$lib/server/logging';
import { categoryFilterToQuery } from './helpers/category/categoryFilterToQuery';
import { categoryCreateInsertionData } from './helpers/category/categoryCreateInsertionData';
import { createCategory } from './helpers/seed/seedCategoryData';
import { createUniqueItemsOnly } from './helpers/seed/createUniqueItemsOnly';
import { streamingDelay } from '$lib/server/testingDelay';
import { count as drizzleCount } from 'drizzle-orm';
import type { StatusEnumType } from '$lib/schema/statusSchema';
import { materializedViewActions } from './materializedViewActions';
import { categoryMaterializedView } from '../postgres/schema/materializedViewSchema';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';

export const categoryActions = {
	getById: async (db: DBType, id: string) => {
		return db.query.category.findFirst({ where: eq(category.id, id) }).execute();
	},
	count: async (db: DBType, filter?: CategoryFilterSchemaType) => {
		materializedViewActions.conditionalRefresh({ db });
		const count = await db
			.select({ count: drizzleCount(categoryMaterializedView.id) })
			.from(categoryMaterializedView)
			.where(and(...(filter ? categoryFilterToQuery({ filter, target: 'category' }) : [])))
			.execute();

		return count[0].count;
	},
	listWithTransactionCount: async (db: DBType) => {
		materializedViewActions.conditionalRefresh({ db });
		const items = db
			.select({ id: categoryMaterializedView.id, journalCount: categoryMaterializedView.count })
			.from(categoryMaterializedView)
			.execute();

		return items;
	},
	list: async ({ db, filter }: { db: DBType; filter: CategoryFilterSchemaType }) => {
		materializedViewActions.conditionalRefresh({ db });
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where = categoryFilterToQuery({ filter: restFilter, target: 'categoryWithSummary' });

		const defaultOrderBy = [
			asc(categoryMaterializedView.group),
			asc(categoryMaterializedView.single),
			desc(categoryMaterializedView.createdAt)
		];

		const orderByResult = orderBy
			? [
					...orderBy.map((currentOrder) =>
						currentOrder.direction === 'asc'
							? asc(categoryMaterializedView[currentOrder.field])
							: desc(categoryMaterializedView[currentOrder.field])
					),
					...defaultOrderBy
				]
			: defaultOrderBy;

		const results = await db
			.select()
			.from(categoryMaterializedView)
			.where(and(...where))
			.limit(pageSize)
			.offset(page * pageSize)
			.orderBy(...orderByResult)
			.execute();

		const resultCount = await db
			.select({ count: drizzleCount(category.id) })
			.from(categoryMaterializedView)
			.where(and(...where))
			.execute();

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: results, pageCount, page, pageSize };
	},
	listForDropdown: async ({ db }: { db: DBType }) => {
		await streamingDelay();
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
			const currentCategory = cachedData
				? cachedData.find((item) => item.id === id)
				: await db.query.category.findFirst({ where: eq(category.id, id) }).execute();

			if (currentCategory) {
				if (requireActive && currentCategory.status !== 'active') {
					throw new Error(`Category ${currentCategory.title} is not active`);
				}
				return currentCategory;
			}
			throw new Error(`Category ${id} not found`);
		} else if (title) {
			const currentCategory = cachedData
				? cachedData.find((item) => item.title === title)
				: await db.query.category.findFirst({ where: eq(category.title, title) }).execute();
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
		await materializedViewActions.setRefreshRequired(db);

		return id;
	},
	createMany: async (db: DBType, data: CreateCategorySchemaType[]) => {
		const ids = data.map(() => nanoid());
		const insertData = data.map((currentData, index) =>
			categoryCreateInsertionData(currentData, ids[index])
		);
		await db.insert(category).values(insertData).execute();
		await materializedViewActions.setRefreshRequired(db);

		return ids;
	},
	update: async (db: DBType, data: UpdateCategorySchemaType) => {
		const { id } = data;
		const currentCategory = await db.query.category
			.findFirst({ where: eq(category.id, id) })
			.execute();

		if (!currentCategory) {
			logging.error('Update Category: Category not found', data);
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
		await materializedViewActions.setRefreshRequired(db);
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
		await materializedViewActions.setRefreshRequired(db);

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
					inArrayWrapped(
						category.id,
						itemsForDeletion.map((item) => item.id)
					)
				)
				.execute();
			await materializedViewActions.setRefreshRequired(db);
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
