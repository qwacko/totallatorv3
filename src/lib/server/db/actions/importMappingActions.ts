import {
	importMappingDetailWithRefinementSchema,
	type ImportMappingDetailSchema,
	type ImportMappingFilterSchema,
	importMappingDetailSchema
} from '$lib/schema/importMappingSchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { importMapping, type ImportMappingType } from '../schema';
import { updatedTime } from './helpers/updatedTime';
import { asc, desc, getTableColumns, and, sql, eq } from 'drizzle-orm';
import { importMappingFilterToQuery } from './helpers/importMappingFilterToQuery';
import { testingDelay } from '$lib/server/testingDelay';

const processImportedDataResult = (data: ImportMappingType) => {
	const { configuration, ...restData } = data;

	const unmappedConfiguration = importMappingDetailSchema.safeParse(JSON.parse(configuration));

	return {
		...restData,
		configuration: unmappedConfiguration.success ? unmappedConfiguration.data : undefined
	};
};

export const importMappingActions = {
	getById: async ({ db, id }: { db: DBType; id: string }) => {
		const data = await db
			.select(getTableColumns(importMapping))
			.from(importMapping)
			.where(eq(importMapping.id, id))
			.execute();

		return data.length === 1 ? processImportedDataResult(data[0]) : undefined;
	},
	list: async ({ db, filter }: { db: DBType; filter: ImportMappingFilterSchema }) => {
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;
		const where = importMappingFilterToQuery(restFilter);
		const defaultOrderBy = [asc(importMapping.title), desc(importMapping.createdAt)];

		const orderByResult = orderBy
			? [
					...orderBy.map((currentOrder) =>
						currentOrder.direction === 'asc'
							? asc(importMapping[currentOrder.field])
							: desc(importMapping[currentOrder.field])
					),
					...defaultOrderBy
			  ]
			: defaultOrderBy;

		const results = await db
			.select(getTableColumns(importMapping))
			.from(importMapping)
			.where(and(...where))
			.orderBy(...orderByResult)
			.limit(pageSize)
			.offset(page * pageSize)
			.execute();

		const resultCount = await db
			.select({
				count: sql<number>`count(${importMapping.id})`.mapWith(Number)
			})
			.from(importMapping)
			.where(and(...where))
			.execute();

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return {
			count,
			data: results.map(processImportedDataResult),
			pageCount,
			page,
			pageSize
		};
	},
	listForDropdown: async ({ db }: { db: DBType }) => {
		await testingDelay();
		const results = await db
			.select({ id: importMapping.id, title: importMapping.title, enabled: sql<boolean>`true` })
			.from(importMapping)
			.orderBy(asc(importMapping.title))
			.execute();

		return results;
	},
	create: async ({
		db,
		data
	}: {
		db: DBType;
		data: {
			title: string;
			configuration: ImportMappingDetailSchema;
			sampleData?: string | undefined;
		};
	}) => {
		const processedConfig = importMappingDetailWithRefinementSchema.safeParse(data.configuration);
		if (!processedConfig.success) {
			throw new Error(`Configuration Error : ${processedConfig.error.message}`);
		}

		const id = nanoid();

		await db.insert(importMapping).values({
			id,
			title: data.title,
			configuration: JSON.stringify(data.configuration),
			sampleData: data.sampleData,
			...updatedTime()
		});

		return id;
	},
	clone: async ({ db, id }: { db: DBType; id: string }) => {
		const data = await db
			.select(getTableColumns(importMapping))
			.from(importMapping)
			.where(eq(importMapping.id, id))
			.execute();

		if (data.length === 1) {
			const targetItem = data[0];

			const newId = nanoid();

			await db.insert(importMapping).values({
				id: newId,
				title: `${targetItem.title} (Clone)`,
				configuration: targetItem.configuration,
				sampleData: targetItem.sampleData,
				...updatedTime()
			});

			return newId;
		}

		return undefined;
	},
	update: async ({
		db,
		id,
		data
	}: {
		db: DBType;
		id: string;
		data: {
			title?: string;
			configuration?: ImportMappingDetailSchema;
			sampleData?: string | undefined;
		};
	}) => {
		const processedConfig = data.configuration
			? importMappingDetailWithRefinementSchema.safeParse(data.configuration)
			: undefined;
		if (processedConfig && !processedConfig.success) {
			throw new Error(`Configuration Error : ${processedConfig.error.message}`);
		}

		await db
			.update(importMapping)
			.set({
				title: data.title,
				configuration:
					data.configuration && processedConfig ? JSON.stringify(processedConfig.data) : undefined,
				sampleData: data.sampleData,
				...updatedTime()
			})
			.where(eq(importMapping.id, id))
			.execute();
	},
	delete: async ({ db, id }: { db: DBType; id: string }) => {
		await db.delete(importMapping).where(eq(importMapping.id, id)).execute();
	}
};
