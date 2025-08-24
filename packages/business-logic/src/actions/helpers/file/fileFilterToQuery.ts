import { eq, gt, gte, isNotNull, isNull, lte, not, SQL } from 'drizzle-orm';

import { associatedInfoTable, fileTable } from '@totallator/database';
import type { DBType } from '@totallator/database';
import type { FileFilterSchemaWithoutPaginationType } from '@totallator/shared';
import type { LinkedFileFilterSchemaType } from '@totallator/shared';

import { dbExecuteLogger } from '@/server/db/dbLogger';

import { arrayToText } from '../misc/arrayToText';
import { filterToQueryFinal } from '../misc/filterToQueryFinal';
import { idTitleFilterToQueryMapped, idTitleFilterToText } from '../misc/filterToQueryTitleIDCore';
import { ilikeArrayWrapped, inArrayWrapped } from '../misc/inArrayWrapped';
import { noteFileRelationshipQuery } from '../misc/noteFileRelationshipQuery';
import { processNoteTextFilter } from './fileTextFilter';

export const fileFilterToQuery = (filter: FileFilterSchemaWithoutPaginationType) => {
	const restFilter = processNoteTextFilter.process(filter);

	const where: SQL<unknown>[] = [];

	//Note that the "Title' column isn't really used
	idTitleFilterToQueryMapped({
		where,
		filter: restFilter,
		idColumn: fileTable.id,
		titleColumn: fileTable.title
	});

	if (restFilter.reasonArray && restFilter.reasonArray.length > 0) {
		where.push(inArrayWrapped(fileTable.reason, restFilter.reasonArray));
	}
	if (restFilter.excludeReasonArray && restFilter.excludeReasonArray.length > 0) {
		where.push(not(inArrayWrapped(fileTable.reason, restFilter.excludeReasonArray)));
	}
	if (restFilter.typeArray && restFilter.typeArray.length > 0) {
		where.push(inArrayWrapped(fileTable.type, restFilter.typeArray));
	}
	if (restFilter.excludeTypeArray && restFilter.excludeTypeArray.length > 0) {
		where.push(not(inArrayWrapped(fileTable.type, restFilter.excludeTypeArray)));
	}
	if (restFilter.filenameArray && restFilter.filenameArray.length > 0) {
		where.push(ilikeArrayWrapped(fileTable.filename, restFilter.filenameArray));
	}
	if (restFilter.excludeFilenameArray && restFilter.excludeFilenameArray.length > 0) {
		where.push(not(ilikeArrayWrapped(fileTable.filename, restFilter.excludeFilenameArray)));
	}
	if (restFilter.maxSize !== undefined) {
		where.push(lte(fileTable.size, restFilter.maxSize));
	}
	if (restFilter.minSize !== undefined) {
		where.push(gte(fileTable.size, restFilter.minSize));
	}
	if (restFilter.linked !== undefined) {
		where.push(eq(associatedInfoTable.linked, restFilter.linked));
	}
	if (restFilter.exists !== undefined) {
		where.push(eq(fileTable.fileExists, restFilter.exists));
	}
	if (restFilter.thumbnail !== undefined) {
		if (restFilter.thumbnail) {
			where.push(isNotNull(fileTable.thumbnailFilename));
		} else {
			where.push(isNull(fileTable.thumbnailFilename));
		}
	}
	noteFileRelationshipQuery({
		where,
		filter: restFilter
	});

	return where;
};

export const fileIdToTitle = async (db: DBType, id: string) => {
	const title = await dbExecuteLogger(
		db.query.fileTable.findFirst({
			where: ({ id: idColumn }, { eq }) => eq(idColumn, id),
			columns: {
				title: true
			}
		}),
		'File ID To Title'
	);
	if (!title || !title.title) {
		return id;
	}
	return title.title;
};

export const fileFilterToText = async ({
	db,
	filter,
	prefix,
	allText = true
}: {
	db: DBType;
	filter: FileFilterSchemaWithoutPaginationType;
	prefix?: string;
	allText?: boolean;
}) => {
	const restFilter = processNoteTextFilter.process(filter);

	const stringArray: string[] = [];

	await idTitleFilterToText(db, stringArray, restFilter, fileIdToTitle);

	if (restFilter.reasonArray && restFilter.reasonArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.reasonArray,
				singularName: 'Reason',
				midText: 'is one of'
			})
		);
	}
	if (restFilter.excludeReasonArray && restFilter.excludeReasonArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.excludeReasonArray,
				singularName: 'Reason',
				midText: 'is not'
			})
		);
	}
	if (restFilter.typeArray && restFilter.typeArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.typeArray,
				singularName: 'Type',
				midText: 'is one of'
			})
		);
	}
	if (restFilter.excludeTypeArray && restFilter.excludeTypeArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.excludeTypeArray,
				singularName: 'Type',
				midText: 'is not'
			})
		);
	}
	if (restFilter.filenameArray && restFilter.filenameArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.filenameArray,
				singularName: 'Filename',
				midText: 'contains'
			})
		);
	}
	if (restFilter.excludeFilenameArray && restFilter.excludeFilenameArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.excludeFilenameArray,
				singularName: 'Filename',
				midText: 'does not contain'
			})
		);
	}
	if (restFilter.maxSize !== undefined) {
		stringArray.push(`Max file size is ${restFilter.maxSize}`);
	}
	if (restFilter.minSize !== undefined) {
		stringArray.push(`Min file size is ${restFilter.minSize}`);
	}
	if (restFilter.linked !== undefined) {
		stringArray.push(
			restFilter.linked ? `File Is Linked To An Item` : `File Is Not Linked To An Item`
		);
	}
	if (restFilter.exists !== undefined) {
		stringArray.push(restFilter.exists ? `File Exists` : `File Is Missing`);
	}
	if (restFilter.thumbnail !== undefined) {
		stringArray.push(restFilter.thumbnail ? `File Has Thumbnail` : `File Does Not Have Thumbnail`);
	}

	return filterToQueryFinal({ stringArray, allText, prefix });
};

export const linkedFileFilterToText = (data: LinkedFileFilterSchemaType, stringArray: string[]) => {
	if (data.file !== undefined) {
		stringArray.push(data.file ? `Has a linked file` : `Does not have a linked file`);
	}
};

export const linkedFileFilterQuery = ({
	filter,
	where,
	fileCountColumn
}: {
	filter: LinkedFileFilterSchemaType;
	where: SQL<unknown>[];
	fileCountColumn: SQL.Aliased<number>;
	// PgColumn<ColumnBaseConfig<'number', string>>;
}) => {
	if (filter.file !== undefined) {
		if (filter.file) {
			where.push(gt(fileCountColumn, 0));
		}
		if (!filter.file) {
			where.push(isNull(fileCountColumn));
		}
	}
};
