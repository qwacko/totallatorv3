import {
	importMappingDetailWithRefinementSchema,
	type ImportMappingDetailSchema,
	type ImportMappingFilterSchema,
	importMappingDetailSchema
} from '@totallator/shared';
import { nanoid } from 'nanoid';
import { importMapping, type ImportMappingTableType } from '@totallator/database';
import { updatedTime } from './helpers/misc/updatedTime';
import { asc, desc, getTableColumns, and, sql, eq, max } from 'drizzle-orm';
import { importMappingFilterToQuery } from './helpers/import/importMappingFilterToQuery';
import { streamingDelay } from '../server/testingDelay';
import { count as drizzleCount } from 'drizzle-orm';
import { dbExecuteLogger } from '@/server/db/dbLogger';
import type { PaginatedResults } from './helpers/journal/PaginationType';
import { getContextDB } from '@totallator/context';

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
	latestUpdate: async (): Promise<Date> => {
		const db = getContextDB();
		const latestUpdate = await dbExecuteLogger(
			db.select({ lastUpdated: max(importMapping.updatedAt) }).from(importMapping),
			'Import Mapping - Latest Update'
		);
		return latestUpdate[0].lastUpdated || new Date();
	},
	getById: async ({ id }: { id: string }): Promise<undefined | ProcessedImportData> => {
		const db = getContextDB();
		const data = await dbExecuteLogger(
			db.select(getTableColumns(importMapping)).from(importMapping).where(eq(importMapping.id, id)),
			'Import Mapping - Get By ID'
		);

		return data.length === 1 ? processImportedDataResult(data[0]) : undefined;
	},
	list: async ({
		filter
	}: {
		filter: ImportMappingFilterSchema;
	}): Promise<PaginatedResults<ProcessedImportData>> => {
		const db = getContextDB();
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
	listForDropdown: async (): Promise<ImportMappingDropdownType> => {
		const db = getContextDB();
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
		data
	}: {
		data: {
			title: string;
			configuration: ImportMappingDetailSchema;
			sampleData?: string | undefined;
		};
	}): Promise<string> => {
		const db = getContextDB();
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
	clone: async ({ id }: { id: string }): Promise<string | undefined> => {
		const db = getContextDB();
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
		id,
		data
	}: {
		id: string;
		data: {
			title?: string;
			configuration?: ImportMappingDetailSchema;
			sampleData?: string | undefined;
		};
	}): Promise<void> => {
		const db = getContextDB();
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
	delete: async ({ id }: { id: string }): Promise<void> => {
		const db = getContextDB();
		await dbExecuteLogger(
			db.delete(importMapping).where(eq(importMapping.id, id)),
			'Import Mapping - Delete'
		);
	}
};

export type ImportMappingDropdownType = { id: string; title: string; enabled: boolean }[];
