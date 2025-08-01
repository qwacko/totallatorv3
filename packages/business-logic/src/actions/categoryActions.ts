import type {
	CreateCategorySchemaType,
	CategoryFilterSchemaType,
	UpdateCategorySchemaType
} from '@totallator/shared';
import { nanoid } from 'nanoid';
import {
	category,
	type CategoryTableType,
	type CategoryViewReturnType
} from '@totallator/database';
import { and, asc, desc, eq, max } from 'drizzle-orm';
import { statusUpdate } from './helpers/misc/statusUpdate';
import { combinedTitleSplit } from '../helpers/combinedTitleSplit';
import { updatedTime } from './helpers/misc/updatedTime';
import { getLogger } from '@/logger';
import { categoryFilterToQuery } from './helpers/category/categoryFilterToQuery';
import { categoryCreateInsertionData } from './helpers/category/categoryCreateInsertionData';
import { createCategory } from './helpers/seed/seedCategoryData';
import { createUniqueItemsOnly } from './helpers/seed/createUniqueItemsOnly';
import { streamingDelay } from '../server/testingDelay';
import { count as drizzleCount } from 'drizzle-orm';
import { materializedViewActions } from './materializedViewActions';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';
import { dbExecuteLogger } from '@/server/db/dbLogger';
import { getCorrectCategoryTable } from './helpers/category/getCorrectCategoryTable';
import type { ItemActionsType } from './helpers/misc/ItemActionsType';
import Papa from 'papaparse';
import { getContextDB } from '@totallator/context';

export type CategoryDropdownType = {
	id: string;
	title: string;
	group: string;
	enabled: boolean;
}[];

type CategoryActionsType = ItemActionsType<
	CategoryTableType,
	CategoryViewReturnType,
	CategoryFilterSchemaType,
	CreateCategorySchemaType,
	UpdateCategorySchemaType,
	CategoryDropdownType,
	number
>;

export const categoryActions: CategoryActionsType = {
	latestUpdate: async () => {
		const db = getContextDB();
		const latestUpdate = await dbExecuteLogger(
			db.select({ lastUpdated: max(category.updatedAt) }).from(category),
			'Category - Latest Update'
		);
		return latestUpdate[0].lastUpdated || new Date();
	},
	getById: async (id) => {
		const db = getContextDB();
		return dbExecuteLogger(
			db.query.category.findFirst({ where: eq(category.id, id) }),
			'Category - Get By Id'
		);
	},
	count: async (filter) => {
		const db = getContextDB();
		const { table, target } = await getCorrectCategoryTable();

		const count = await dbExecuteLogger(
			db
				.select({ count: drizzleCount(table.id) })
				.from(table)
				.where(and(...(filter ? categoryFilterToQuery({ filter, target }) : []))),
			'Category - Count'
		);

		return count[0].count;
	},
	listWithTransactionCount: async () => {
		const db = getContextDB();
		const { table } = await getCorrectCategoryTable();
		const items = dbExecuteLogger(
			db.select({ id: table.id, journalCount: table.count }).from(table),
			'Category - List With Transaction Count'
		);

		return items;
	},
	list: async ({ filter }) => {
		const db = getContextDB();
		const { table, target } = await getCorrectCategoryTable();

		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where = categoryFilterToQuery({ filter: restFilter, target });

		const defaultOrderBy = [asc(table.group), asc(table.single), desc(table.createdAt)];

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
			'Category - List - Results'
		);

		const resultCount = await dbExecuteLogger(
			db
				.select({ count: drizzleCount(table.id) })
				.from(table)
				.where(and(...where)),
			'Category - List - Count'
		);

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: results, pageCount, page, pageSize };
	},
	generateCSVData: async ({ filter, returnType }) => {
		const data = await categoryActions.list({
			filter: { ...filter, page: 0, pageSize: 100000 }
		});

		const preppedData = data.data.map((item, row) => {
			if (returnType === 'import') {
				return {
					title: item.title,
					status: item.status
				} satisfies CreateCategorySchemaType;
			}
			return {
				row,
				id: item.id,
				title: item.title,
				group: item.group,
				single: item.single,
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
					id: category.id,
					title: category.title,
					group: category.group,
					enabled: category.allowUpdate
				})
				.from(category),
			'Category - List For Dropdown'
		);

		return items;
	},
	createOrGet: async ({ title, id, requireActive = true, cachedData }) => {
		const db = getContextDB();
		if (id) {
			const currentCategory = cachedData
				? cachedData.find((item) => item.id === id)
				: await dbExecuteLogger(
						db.query.category.findFirst({ where: eq(category.id, id) }),
						'Category - Create Or Get - Get By Id'
					);

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
				: await dbExecuteLogger(
						db.query.category.findFirst({ where: eq(category.title, title) }),
						'Category - Create Or Get - Get By Title'
					);
			if (currentCategory) {
				if (requireActive && currentCategory.status !== 'active') {
					throw new Error(`Category ${currentCategory.title} is not active`);
				}
				return currentCategory;
			}
			const newCategoryId = await categoryActions.create({
				title,
				status: 'active'
			});
			const newCategory = await dbExecuteLogger(
				db.query.category.findFirst({ where: eq(category.id, newCategoryId) }),
				'Category - Create Or Get'
			);
			if (!newCategory) {
				throw new Error('Error Creating Category');
			}
			return newCategory;
		} else {
			return undefined;
		}
	},
	create: async (data) => {
		const db = getContextDB();
		const id = nanoid();
		await dbExecuteLogger(
			db.insert(category).values(categoryCreateInsertionData(data, id)),
			'Category - Create'
		);
		await materializedViewActions.setRefreshRequired();

		return id;
	},
	createMany: async (data) => {
		const db = getContextDB();
		const ids = data.map(() => nanoid());
		const insertData = data.map((currentData, index) =>
			categoryCreateInsertionData(currentData, ids[index])
		);
		await dbExecuteLogger(db.insert(category).values(insertData), 'Category - Create Many');
		await materializedViewActions.setRefreshRequired();

		return ids;
	},
	update: async ({ data, id }) => {
		const db = getContextDB();
		const currentCategory = await dbExecuteLogger(
			db.query.category.findFirst({ where: eq(category.id, id) }),
			'Category - Update - Current Category'
		);

		if (!currentCategory) {
			getLogger().error('Update Category: Category not found', data);
			return id;
		}

		await dbExecuteLogger(
			db
				.update(category)
				.set({
					...statusUpdate(data.status),
					...updatedTime(),
					...combinedTitleSplit(data)
				})
				.where(eq(category.id, id)),
			'Category - Update'
		);
		await materializedViewActions.setRefreshRequired();
		return id;
	},
	canDeleteMany: async (ids) => {
		const canDeleteList = await Promise.all(
			ids.map(async (id) => categoryActions.canDelete({ id }))
		);

		return canDeleteList.reduce((prev, current) => (current === false ? false : prev), true);
	},
	canDelete: async (data) => {
		const db = getContextDB();
		const currentCategory = await dbExecuteLogger(
			db.query.category.findFirst({
				where: eq(category.id, data.id),
				with: { journals: { limit: 1 } }
			}),
			'Category - Can Delete'
		);
		if (!currentCategory) {
			return true;
		}

		// If the category has no journals, then mark as deleted, otherwise do nothing
		return currentCategory && currentCategory.journals.length === 0;
	},
	delete: async (data) => {
		const db = getContextDB();
		if (await categoryActions.canDelete(data)) {
			await dbExecuteLogger(
				db.delete(category).where(eq(category.id, data.id)),
				'Category - Delete'
			);
		}
		await materializedViewActions.setRefreshRequired();

		return data.id;
	},
	deleteMany: async (data) => {
		const db = getContextDB();
		if (data.length === 0) return;
		const currentCategories = await categoryActions.listWithTransactionCount();
		const itemsForDeletion = data.filter((item) => {
			const currentCategory = currentCategories.find((current) => current.id === item.id);
			return currentCategory && currentCategory.journalCount === 0;
		});
		if (itemsForDeletion.length === data.length) {
			await dbExecuteLogger(
				db.delete(category).where(
					inArrayWrapped(
						category.id,
						itemsForDeletion.map((item) => item.id)
					)
				),
				'Category - Delete Many'
			);
			await materializedViewActions.setRefreshRequired();
			return true;
		}
		return false;
	},
	seed: async (count) => {
		const db = getContextDB();
		getLogger().info('Seeding Categories : ', count);

		const existingTitles = (
			await dbExecuteLogger(
				db.query.category.findMany({ columns: { title: true } }),
				'Category - Seed'
			)
		).map((item) => item.title);
		const itemsToCreate = createUniqueItemsOnly({
			existing: existingTitles,
			creationToString: (creation) => creation.title,
			createItem: createCategory,
			count
		});

		await categoryActions.createMany(itemsToCreate);
	}
};
