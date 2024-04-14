import { fileTable } from '../../../postgres/schema';
import { SQL, not, eq, lte, gte } from 'drizzle-orm';
import { idTitleFilterToQueryMapped, idTitleFilterToText } from '../misc/filterToQueryTitleIDCore';
import { filterToQueryFinal } from '../misc/filterToQueryFinal';
import type { DBType } from '$lib/server/db/db';
import { processNoteTextFilter } from './fileTextFilter';
import { inArrayWrapped } from '../misc/inArrayWrapped';
import { noteFileRelationshipQuery } from '../misc/noteFileRelationshipQuery';
import { arrayToText } from '../misc/arrayToText';
import type { FileFilterSchemaWithoutPaginationType } from '$lib/schema/fileSchema';

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
		where.push(inArrayWrapped(fileTable.filename, restFilter.filenameArray));
	}
	if (restFilter.excludeFilenameArray && restFilter.excludeFilenameArray.length > 0) {
		where.push(not(inArrayWrapped(fileTable.filename, restFilter.excludeFilenameArray)));
	}
	if (restFilter.maxSize !== undefined) {
		where.push(lte(fileTable.size, restFilter.maxSize));
	}
	if (restFilter.minSize !== undefined) {
		where.push(gte(fileTable.size, restFilter.minSize));
	}
	if (restFilter.linked !== undefined) {
		where.push(eq(fileTable.linked, restFilter.linked));
	}
	if (restFilter.exists !== undefined) {
		where.push(eq(fileTable.fileExists, restFilter.exists));
	}
	noteFileRelationshipQuery({
		where,
		filter: restFilter,
		table: fileTable
	});

	return where;
};

export const fileIdToTitle = async (db: DBType, id: string) => {
	const title = await db.query.fileTable.findFirst({
		where: ({ id: idColumn }, { eq }) => eq(idColumn, id),
		columns: {
			title: true
		}
	});
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

	return filterToQueryFinal({ stringArray, allText, prefix });
};
