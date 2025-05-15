import type { DBType } from '$lib/server/db/db';
import { getTableColumns, sql, eq } from 'drizzle-orm';
import {
	importItemDetail,
	importMapping,
	importTable,
	type ImportTableType
} from '../../../postgres/schema';

export const importListSubquery = (db: DBType) =>
	db
		.select({
			...getTableColumns(importTable),
			importMappingId: sql`${importMapping.id}`.mapWith(String).as('importMappingId'),
			importMappingTitle: sql`${importMapping.title}`.mapWith(String).as('importMappingTitle'),
			numErrors: sql`count(CASE WHEN ${importItemDetail.status} = 'error' THEN 1 ELSE NULL END)`
				.mapWith(Number)
				.as('numErrors'),
			numImportErrors:
				sql`count(CASE WHEN ${importItemDetail.status} = 'importError' THEN 1 ELSE NULL END)`
					.mapWith(Number)
					.as('numImportErrors'),
			numProcessed:
				sql`count(CASE WHEN ${importItemDetail.status} = 'processed' THEN 1 ELSE NULL END)`
					.mapWith(Number)
					.as('numProcessed'),
			numDuplicate:
				sql`count(CASE WHEN ${importItemDetail.status} = 'duplicate' THEN 1 ELSE NULL END)`
					.mapWith(Number)
					.as('numDuplicate'),
			numImport: sql`count(CASE WHEN ${importItemDetail.status} = 'imported' THEN 1 ELSE NULL END)`
				.mapWith(Number)
				.as('numImport'),
			numImportError:
				sql`count(CASE WHEN ${importItemDetail.status} = 'importError' THEN 1 ELSE NULL END)`
					.mapWith(Number)
					.as('numImportError')
		})
		.from(importTable)
		.leftJoin(importItemDetail, eq(importItemDetail.importId, importTable.id))
		.leftJoin(importMapping, eq(importMapping.id, importTable.importMappingId))
		.groupBy(importTable.id, importMapping.id, importMapping.title)
		.as('importSubquery');

export type ImportSubqueryType = ReturnType<typeof importListSubquery>;
export type ImportSubqueryReturnData = ImportTableType & {
	importMappingId: string;
	importMappingTitle: string;
	numErrors: number;
	numImportErrors: number;
	numProcessed: number;
	numDuplicate: number;
	numImport: number;
	numImportError: number;
};
