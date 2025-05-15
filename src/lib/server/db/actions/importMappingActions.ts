import {
	importMappingDetailWithRefinementSchema,
	type ImportMappingDetailSchema,
	type ImportMappingFilterSchema,
	importMappingDetailSchema
} from '$lib/schema/importMappingSchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { importMapping, type ImportMappingTableType } from '../postgres/schema';
import { updatedTime } from './helpers/misc/updatedTime';
import { asc, desc, getTableColumns, and, sql, eq, max } from 'drizzle-orm';
import { importMappingFilterToQuery } from './helpers/import/importMappingFilterToQuery';
import { streamingDelay } from '$lib/server/testingDelay';
import { count as drizzleCount } from 'drizzle-orm';
import { dbExecuteLogger } from '../dbLogger';
import type { PaginatedResults } from './helpers/journal/PaginationType';

type ProcessedImportData = Omit<ImportMappingTableType, 'configuration'> & {
	configuration: undefined | ImportMappingDetailSchema;
};

const processImportedDataResult = (data: ImportMappingTableType): ProcessedImportData => {
	const { configuration, ...restData } = data;

	const unmappedConfiguration = importMappingDetailSchema.safeParse(JSON.parse(configuration));

	return {
		...restData,
		configuration: unmappedConfiguration.success ? unmappedConfiguration.data : undefined
	};
};

export const importMappingActions = {
	latestUpdate: async ({ db }: { db: DBType }): Promise<Date> => {
		const latestUpdate = await dbExecuteLogger(
			db.select({ lastUpdated: max(importMapping.updatedAt) }).from(importMapping),
			'Import Mapping - Latest Update'
		);
		return latestUpdate[0].lastUpdated || new Date();
	},
	getById: async ({
		db,
		id
	}: {
		db: DBType;
		id: string;
	}): Promise<undefined | ProcessedImportData> => {
		const data = await dbExecuteLogger(
			db.select(getTableColumns(importMapping)).from(importMapping).where(eq(importMapping.id, id)),
			'Import Mapping - Get By ID'
		);

		return data.length === 1 ? processImportedDataResult(data[0]) : undefined;
	},
	list: async ({
		db,
		filter
	}: {
		db: DBType;
		filter: ImportMappingFilterSchema;
	}): Promise<PaginatedResults<ProcessedImportData>> => {
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

		const results = await dbExecuteLogger(
			db
				.select(getTableColumns(importMapping))
				.from(importMapping)
				.where(and(...where))
				.orderBy(...orderByResult)
				.limit(pageSize)
				.offset(page * pageSize),
			'Import Mapping - List - Results'
		);

		const resultCount = await dbExecuteLogger(
			db
				.select({
					count: drizzleCount(importMapping.id)
				})
				.from(importMapping)
				.where(and(...where)),
			'Import Mapping - List - Count'
		);

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
	listForDropdown: async ({ db }: { db: DBType }): Promise<ImportMappingDropdownType> => {
		await streamingDelay();
		const results = await dbExecuteLogger(
			db
				.select({ id: importMapping.id, title: importMapping.title, enabled: sql<boolean>`true` })
				.from(importMapping)
				.orderBy(asc(importMapping.title)),
			'Import Mapping - List For Dropdown'
		);

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
	}): Promise<string> => {
		const processedConfig = importMappingDetailWithRefinementSchema.safeParse(data.configuration);
		if (!processedConfig.success) {
			throw new Error(`Configuration Error : ${processedConfig.error.message}`);
		}

		const id = nanoid();

		await dbExecuteLogger(
			db.insert(importMapping).values({
				id,
				title: data.title,
				configuration: JSON.stringify(data.configuration),
				sampleData: data.sampleData,
				...updatedTime()
			}),
			'Import Mapping - Create'
		);

		return id;
	},
	clone: async ({ db, id }: { db: DBType; id: string }): Promise<string | undefined> => {
		const data = await dbExecuteLogger(
			db.select(getTableColumns(importMapping)).from(importMapping).where(eq(importMapping.id, id)),
			'Import Mapping - Clone - Find'
		);

		if (data.length === 1) {
			const targetItem = data[0];

			const newId = nanoid();

			await dbExecuteLogger(
				db.insert(importMapping).values({
					id: newId,
					title: `${targetItem.title} (Clone)`,
					configuration: targetItem.configuration,
					sampleData: targetItem.sampleData,
					...updatedTime()
				}),
				'Import Mapping - Clone - Insert'
			);

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
	}): Promise<void> => {
		const processedConfig = data.configuration
			? importMappingDetailWithRefinementSchema.safeParse(data.configuration)
			: undefined;
		if (processedConfig && !processedConfig.success) {
			throw new Error(`Configuration Error : ${processedConfig.error.message}`);
		}

		await dbExecuteLogger(
			db
				.update(importMapping)
				.set({
					title: data.title,
					configuration:
						data.configuration && processedConfig
							? JSON.stringify(processedConfig.data)
							: undefined,
					sampleData: data.sampleData,
					...updatedTime()
				})
				.where(eq(importMapping.id, id)),
			'Import Mapping - Update'
		);
	},
	delete: async ({ db, id }: { db: DBType; id: string }): Promise<void> => {
		await dbExecuteLogger(
			db.delete(importMapping).where(eq(importMapping.id, id)),
			'Import Mapping - Delete'
		);
	}
};

export type ImportMappingDropdownType = { id: string; title: string; enabled: boolean }[];
