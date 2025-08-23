import { and, asc, desc, eq, max } from 'drizzle-orm';
import { count as drizzleCount } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import Papa from 'papaparse';

import { getContextDB } from '@totallator/context';
import {
	category,
	type CategoryTableType,
	type CategoryViewReturnType
} from '@totallator/database';
import type {
	CategoryFilterSchemaType,
	CreateCategorySchemaType,
	UpdateCategorySchemaType
} from '@totallator/shared';

import { getLogger } from '@/logger';
import { dbExecuteLogger } from '@/server/db/dbLogger';

import { combinedTitleSplit } from '../helpers/combinedTitleSplit';
import { streamingDelay } from '../server/testingDelay';
import { categoryCreateInsertionData } from './helpers/category/categoryCreateInsertionData';
import { categoryFilterToQuery } from './helpers/category/categoryFilterToQuery';
import { getCorrectCategoryTable } from './helpers/category/getCorrectCategoryTable';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';
import type { ItemActionsType } from './helpers/misc/ItemActionsType';
import { statusUpdate } from './helpers/misc/statusUpdate';
import { updatedTime } from './helpers/misc/updatedTime';
import { createUniqueItemsOnly } from './helpers/seed/createUniqueItemsOnly';
import { createCategory } from './helpers/seed/seedCategoryData';
import { materializedViewActions } from './materializedViewActions';

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

		getLogger('categories').debug({
			code: 'CAT_100',
			title: 'Getting category by ID',
			categoryId: id
		});

		const result = await dbExecuteLogger(
			db.query.category.findFirst({ where: eq(category.id, id) }),
			'Category - Get By Id'
		);

		getLogger('categories').debug({
			code: 'CAT_101',
			title: result ? 'Category found by ID' : 'Category not found by ID',
			categoryId: id,
			found: !!result
		});

		return result;
	},
	count: async (filter) => {
		const db = getContextDB();
		const { table, target } = await getCorrectCategoryTable();

		getLogger('categories').debug({
			code: 'CAT_140',
			title: 'Counting categories with filter',
			filter
		});

		const count = await dbExecuteLogger(
			db
				.select({ count: drizzleCount(table.id) })
				.from(table)
				.where(and(...(filter ? categoryFilterToQuery({ filter, target }) : []))),
			'Category - Count'
		);

		getLogger('categories').debug({
			code: 'CAT_141',
			title: 'Category count result',
			count: count[0].count,
			filter
		});

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

		getLogger('categories').debug({
			code: 'CAT_110',
			title: 'Listing categories with filter',
			filter: { page, pageSize, ...restFilter },
			hasOrderBy: !!orderBy
		});

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

		getLogger('categories').debug({
			code: 'CAT_111',
			title: 'Category list results',
			totalCount: count,
			resultsReturned: results.length,
			pageCount,
			currentPage: page
		});

		return { count, data: results, pageCount, page, pageSize };
	},
	generateCSVData: async ({ filter, returnType }) => {
		getLogger('categories').info({
			code: 'CAT_120',
			title: 'Generating CSV data for categories',
			returnType,
			filter
		});

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

		getLogger('categories').info({
			code: 'CAT_121',
			title: 'CSV data generated successfully',
			returnType,
			recordCount: preppedData.length,
			csvLength: csvData.length
		});

		return csvData;
	},
	listForDropdown: async () => {
		const db = getContextDB();

		getLogger('categories').debug({
			code: 'CAT_130',
			title: 'Listing categories for dropdown'
		});

		await streamingDelay();
		const items = await dbExecuteLogger(
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

		getLogger('categories').debug({
			code: 'CAT_131',
			title: 'Dropdown categories retrieved',
			count: items.length
		});

		return items;
	},
	createOrGet: async ({ title, id, requireActive = true, cachedData }) => {
		const db = getContextDB();

		getLogger('categories').debug({
			code: 'CAT_040',
			title: 'Creating or getting category',
			categoryId: id,
			categoryTitle: title,
			requireActive
		});

		if (id) {
			const currentCategory = cachedData
				? cachedData.find((item) => item.id === id)
				: await dbExecuteLogger(
						db.query.category.findFirst({ where: eq(category.id, id) }),
						'Category - Create Or Get - Get By Id'
					);

			if (currentCategory) {
				if (requireActive && currentCategory.status !== 'active') {
					getLogger('categories').warn({
						code: 'CAT_041',
						title: 'Category found but not active',
						categoryId: id,
						categoryTitle: currentCategory.title,
						status: currentCategory.status
					});
					throw new Error(`Category ${currentCategory.title} is not active`);
				}
				getLogger('categories').debug({
					code: 'CAT_042',
					title: 'Found existing category by ID',
					categoryId: id
				});
				return currentCategory;
			}
			getLogger('categories').error({
				code: 'CAT_043',
				title: 'Category not found by ID',
				categoryId: id
			});
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
					getLogger('categories').warn({
						code: 'CAT_044',
						title: 'Category found by title but not active',
						categoryTitle: title,
						status: currentCategory.status
					});
					throw new Error(`Category ${currentCategory.title} is not active`);
				}
				getLogger('categories').debug({
					code: 'CAT_045',
					title: 'Found existing category by title',
					categoryTitle: title
				});
				return currentCategory;
			}
			getLogger('categories').info({
				code: 'CAT_046',
				title: 'Creating new category from title',
				categoryTitle: title,
				status: 'active'
			});

			const newCategoryId = await categoryActions.create({
				title,
				status: 'active'
			});
			const newCategory = await dbExecuteLogger(
				db.query.category.findFirst({ where: eq(category.id, newCategoryId) }),
				'Category - Create Or Get'
			);
			if (!newCategory) {
				getLogger('categories').error({
					code: 'CAT_047',
					title: 'Failed to create category from title',
					categoryTitle: title
				});
				throw new Error('Error Creating Category');
			}
			getLogger('categories').info({
				code: 'CAT_048',
				title: 'Successfully created category from title',
				categoryId: newCategoryId,
				categoryTitle: title
			});
			return newCategory;
		} else {
			return undefined;
		}
	},
	create: async (data) => {
		const db = getContextDB();
		const id = nanoid();
		const startTime = Date.now();

		getLogger('categories').info({
			code: 'CAT_010',
			title: 'Creating new category',
			categoryId: id,
			categoryTitle: data.title,
			status: data.status
		});

		try {
			await dbExecuteLogger(
				db.insert(category).values(categoryCreateInsertionData(data, id)),
				'Category - Create'
			);
			await materializedViewActions.setRefreshRequired();

			const duration = Date.now() - startTime;
			getLogger('categories').info({
				code: 'CAT_011',
				title: 'Category created successfully',
				categoryId: id,
				categoryTitle: data.title,
				duration
			});

			return id;
		} catch (e) {
			getLogger('categories').error({
				code: 'CAT_012',
				title: 'Failed to create category',
				categoryId: id,
				categoryTitle: data.title,
				error: e
			});
			throw e;
		}
	},
	createMany: async (data) => {
		const db = getContextDB();
		const startTime = Date.now();

		getLogger('categories').info({
			code: 'CAT_050',
			title: 'Creating multiple categories',
			count: data.length
		});

		try {
			const ids = data.map(() => nanoid());
			const insertData = data.map((currentData, index) =>
				categoryCreateInsertionData(currentData, ids[index])
			);
			await dbExecuteLogger(db.insert(category).values(insertData), 'Category - Create Many');
			await materializedViewActions.setRefreshRequired();

			const duration = Date.now() - startTime;
			getLogger('categories').info({
				code: 'CAT_051',
				title: 'Successfully created multiple categories',
				count: data.length,
				duration
			});

			return ids;
		} catch (e) {
			getLogger('categories').error({
				code: 'CAT_052',
				title: 'Failed to create multiple categories',
				count: data.length,
				error: e
			});
			throw e;
		}
	},
	update: async ({ data, id }) => {
		const db = getContextDB();
		const startTime = Date.now();

		getLogger('categories').debug({
			code: 'CAT_020',
			title: 'Starting category update',
			categoryId: id,
			updateData: data
		});

		const currentCategory = await dbExecuteLogger(
			db.query.category.findFirst({ where: eq(category.id, id) }),
			'Category - Update - Current Category'
		);

		if (!currentCategory) {
			getLogger('categories').error({
				code: 'CAT_021',
				title: 'Category not found for update',
				categoryId: id
			});
			return id;
		}

		try {
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

			const duration = Date.now() - startTime;
			getLogger('categories').info({
				code: 'CAT_022',
				title: 'Category updated successfully',
				categoryId: id,
				categoryTitle: data.title,
				duration
			});

			return id;
		} catch (e) {
			getLogger('categories').error({
				code: 'CAT_023',
				title: 'Failed to update category',
				categoryId: id,
				error: e
			});
			throw e;
		}
	},
	canDeleteMany: async (ids) => {
		getLogger('categories').debug({
			code: 'CAT_090',
			title: 'Checking if multiple categories can be deleted',
			count: ids.length,
			categoryIds: ids
		});

		const canDeleteList = await Promise.all(
			ids.map(async (id) => categoryActions.canDelete({ id }))
		);

		const canDeleteAll = canDeleteList.reduce(
			(prev, current) => (current === false ? false : prev),
			true
		);
		getLogger('categories').debug({
			code: 'CAT_091',
			title: canDeleteAll ? 'All categories can be deleted' : 'Some categories cannot be deleted',
			canDeleteAll,
			deletableCount: canDeleteList.filter(Boolean).length,
			totalCount: ids.length
		});

		return canDeleteAll;
	},
	canDelete: async (data) => {
		const db = getContextDB();

		getLogger('categories').debug({
			code: 'CAT_080',
			title: 'Checking if category can be deleted',
			categoryId: data.id
		});

		const currentCategory = await dbExecuteLogger(
			db.query.category.findFirst({
				where: eq(category.id, data.id),
				with: { journals: { limit: 1 } }
			}),
			'Category - Can Delete'
		);
		if (!currentCategory) {
			getLogger('categories').debug({
				code: 'CAT_081',
				title: 'Category not found, can be deleted',
				categoryId: data.id
			});
			return true;
		}

		// If the category has no journals, then mark as deleted, otherwise do nothing
		const canDelete = currentCategory && currentCategory.journals.length === 0;
		getLogger('categories').debug({
			code: 'CAT_082',
			title: canDelete
				? 'Category can be deleted'
				: 'Category cannot be deleted - has journal entries',
			categoryId: data.id,
			journalCount: currentCategory.journals.length,
			canDelete
		});

		return canDelete;
	},
	delete: async (data) => {
		const db = getContextDB();

		getLogger('categories').info({
			code: 'CAT_030',
			title: 'Attempting to delete category',
			categoryId: data.id
		});

		// If the category has no journals, then mark as deleted, otherwise do nothing
		if (await categoryActions.canDelete(data)) {
			await dbExecuteLogger(
				db.delete(category).where(eq(category.id, data.id)),
				'Category - Delete'
			);
			getLogger('categories').info({
				code: 'CAT_031',
				title: 'Category deleted successfully',
				categoryId: data.id
			});
		} else {
			getLogger('categories').warn({
				code: 'CAT_032',
				title: 'Category cannot be deleted - has journal entries',
				categoryId: data.id
			});
		}
		await materializedViewActions.setRefreshRequired();

		return data.id;
	},
	deleteMany: async (data) => {
		const db = getContextDB();
		if (data.length === 0) {
			getLogger('categories').debug({
				code: 'CAT_060',
				title: 'Delete many categories called with empty array'
			});
			return;
		}

		getLogger('categories').info({
			code: 'CAT_061',
			title: 'Attempting to delete multiple categories',
			count: data.length,
			categoryIds: data.map((item) => item.id)
		});

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
			getLogger('categories').info({
				code: 'CAT_062',
				title: 'Successfully deleted multiple categories',
				count: itemsForDeletion.length,
				categoryIds: itemsForDeletion.map((item) => item.id)
			});
			await materializedViewActions.setRefreshRequired();
			return true;
		} else {
			getLogger('categories').warn({
				code: 'CAT_063',
				title: 'Cannot delete all categories - some have journal entries',
				totalRequested: data.length,
				eligibleForDeletion: itemsForDeletion.length
			});
		}
		return false;
	},
	seed: async (count) => {
		const db = getContextDB();
		getLogger('categories').info({
			code: 'CAT_070',
			title: 'Seeding Categories',
			count
		});

		try {
			const existingTitles = (
				await dbExecuteLogger(
					db.query.category.findMany({ columns: { title: true } }),
					'Category - Seed'
				)
			).map((item) => item.title);

			getLogger('categories').debug({
				code: 'CAT_071',
				title: 'Creating unique categories for seeding',
				existingCount: existingTitles.length,
				requestedCount: count
			});

			const itemsToCreate = createUniqueItemsOnly({
				existing: existingTitles,
				creationToString: (creation) => creation.title,
				createItem: createCategory,
				count
			});

			await categoryActions.createMany(itemsToCreate);

			getLogger('categories').info({
				code: 'CAT_072',
				title: 'Categories seeded successfully',
				createdCount: itemsToCreate.length
			});
		} catch (e) {
			getLogger('categories').error({
				code: 'CAT_073',
				title: 'Failed to seed categories',
				count,
				error: e
			});
			throw e;
		}
	}
};
