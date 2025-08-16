import {
	updateAutoImportSchema,
	type AutoImportFilterSchemaType,
	type CreateAutoImportSchemaType,
	type UpdateAutoImportFormSchemaType,
	type AutoImportFrequencyType
} from '@totallator/shared';
import { nanoid } from 'nanoid';
import {
	autoImportTable,
	importMapping,
	importTable,
	type AutoImportTableType
} from '@totallator/database';
import { updatedTime } from './helpers/misc/updatedTime';
import { eq, and, getTableColumns, count as drizzleCount } from 'drizzle-orm';
import { autoImportFilterToQuery } from './helpers/autoImport/autoImportFilterToQuery';
import { autoImportToOrderByToSQL } from './helpers/autoImport/autoImportOrderByToSQL';
import type { PaginatedResults } from './helpers/journal/PaginationType';
import { getData_Common } from './helpers/autoImport/getData_Common';
import { getLogger } from '@/logger';
import { dbExecuteLogger } from '@/server/db/dbLogger';
import { importActions } from './importActions';
import { importMappingActions } from './importMappingActions';
import { getContextDB, runInTransactionWithLogging } from '@totallator/context';

export const autoImportActions = {
	list: async ({
		filter
	}: {
		filter: AutoImportFilterSchemaType;
	}): Promise<
		PaginatedResults<AutoImportTableType & { importMappingTitle: string | null | undefined }>
	> => {
		const db = getContextDB();
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where = autoImportFilterToQuery({ filter: restFilter });

		const results = await dbExecuteLogger(
			db
				.select({
					...getTableColumns(autoImportTable),
					importMappingTitle: importMapping.title
				})
				.from(autoImportTable)
				.where(and(...where))
				.limit(pageSize)
				.leftJoin(importMapping, eq(autoImportTable.importMappingId, importMapping.id))
				.offset(page * pageSize)
				.orderBy(...autoImportToOrderByToSQL({ orderBy })),
			'Auto Import - List - Query'
		);

		const resultCount = await dbExecuteLogger(
			db
				.select({ count: drizzleCount(autoImportTable.id) })
				.from(autoImportTable)
				.where(and(...where)),
			'Auto Import - List - Count'
		);

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: results, pageCount, page, pageSize };
	},
	getById: async ({ id }: { id: string }): Promise<AutoImportTableType | null> => {
		const db = getContextDB();
		const autoImport = await dbExecuteLogger(
			db.select().from(autoImportTable).where(eq(autoImportTable.id, id)),
			'Auto Import - Get By Id'
		);

		if (autoImport.length === 0) {
			return null;
		}

		return autoImport[0];
	},
	clone: async ({ id }: { id: string }): Promise<string> => {
		const db = getContextDB();
		const autoImport = await autoImportActions.getById({ id });

		if (!autoImport) {
			throw new Error(`AutoImport with id ${id} not found`);
		}

		const newId = nanoid();
		await dbExecuteLogger(
			db.insert(autoImportTable).values({
				...autoImport,
				id: newId,
				title: `${autoImport.title} (Copy)`,
				enabled: false,
				...updatedTime()
			}),
			'Auto Import - Clone'
		);

		return newId;
	},
	create: async ({ data }: { data: CreateAutoImportSchemaType }): Promise<string> => {
		const db = getContextDB();
		const id = nanoid();
		await dbExecuteLogger(
			db.insert(autoImportTable).values({ id, ...data, ...updatedTime() }),
			'Auto Import - Create'
		);

		return id;
	},
	delete: async ({ id }: { id: string }): Promise<void> => {
		await runInTransactionWithLogging('Delete Auto Import', async () => {
			const db = getContextDB();
			await dbExecuteLogger(
				db.delete(autoImportTable).where(eq(autoImportTable.id, id)),
				'Auto Import - Delete'
			);

			await dbExecuteLogger(
				db.update(importTable).set({ autoImportId: null }).where(eq(importTable.autoImportId, id)),
				'Auto Import - Delete - Update Import'
			);
		});
	},
	update: async ({ data }: { data: UpdateAutoImportFormSchemaType }): Promise<void> => {
		const db = getContextDB();
		const matchingAutoImport = await dbExecuteLogger(
			db.query.autoImportTable.findFirst({
				where: (autoImport, { eq }) => eq(autoImport.id, data.id)
			}),
			'Auto Import - Update - Find'
		);

		if (!matchingAutoImport) {
			throw new Error(`AutoImport with id ${data.id} not found`);
		}

		const {
			id,
			title,
			enabled,
			importMappingId,
			frequency,
			type,
			autoProcess,
			autoClean,
			...config
		} = data;

		const newData = {
			title: title ?? matchingAutoImport.title,
			enabled: enabled === undefined ? matchingAutoImport.enabled : enabled,
			importMappingId: importMappingId ?? matchingAutoImport.importMappingId,
			frequency: frequency ?? matchingAutoImport.frequency,
			type: type ?? matchingAutoImport.type,
			autoProcess: autoProcess ?? matchingAutoImport.autoProcess,
			autoClean: autoClean ?? matchingAutoImport.autoClean,
			config: {
				...matchingAutoImport.config,
				...config
			}
		};

		const validatedUpdate = updateAutoImportSchema.safeParse(newData);

		if (!validatedUpdate.success) {
			throw new Error(`Invalid update data: ${validatedUpdate.error.message}`);
		}

		await dbExecuteLogger(
			db
				.update(autoImportTable)
				.set({
					...validatedUpdate.data,
					...updatedTime()
				})
				.where(eq(autoImportTable.id, id)),
			'Auto Import - Update'
		);
	},
	getData: async ({ id }: { id: string }): Promise<Record<string, any>[]> => {
		const autoImport = await autoImportActions.getById({ id });

		if (!autoImport) {
			throw new Error(`AutoImport with id ${id} not found`);
		}

		return getData_Common({ config: autoImport.config });
	},
	updateSampleData: async ({ id }: { id: string }): Promise<void> => {
		const autoImport = await autoImportActions.getById({ id });

		if (!autoImport) {
			throw new Error(`AutoImport with id ${id} not found`);
		}

		const data = await autoImportActions.getData({ id });

		if (data.length > 0) {
			await importMappingActions.update({
				id: autoImport.importMappingId,
				data: { sampleData: JSON.stringify(data.slice(0, 5)) }
			});
		}
	},
	triggerMany: async ({ frequency }: { frequency: AutoImportFrequencyType }): Promise<void> => {
		const autoImports = await autoImportActions.list({
			filter: { frequency: [frequency], enabled: true, pageSize: 1000 }
		});
		for (const currentAutoImport of autoImports.data) {
			await autoImportActions.trigger({ id: currentAutoImport.id });
		}
	},
	trigger: async ({ id }: { id: string }): Promise<void> => {
		const autoImport = await autoImportActions.getById({ id });

		if (!autoImport) {
			throw new Error(`AutoImport with id ${id} not found`);
		}

		const data = await autoImportActions.getData({ id });

		getLogger('auto-import').pino.debug(
			{ length: data.length, title: autoImport.title },
			'Triggering Import'
		);

		const dateString = new Date().toISOString().slice(0, 10);

		const file = new File([JSON.stringify(data)], `${dateString}-${autoImport.title}.json`, {
			type: 'application/json'
		});

		await importActions.store({
			autoImportId: id,
			data: {
				autoClean: autoImport.autoClean,
				autoProcess: autoImport.autoProcess,
				checkImportedOnly: false,
				importType: 'mappedImport',
				importMappingId: autoImport.importMappingId,
				file
			}
		});
	}
};
