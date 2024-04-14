import { notesTable } from '../../../postgres/schema';
import { SQL, not } from 'drizzle-orm';
import { idTitleFilterToQueryMapped } from '../misc/filterToQueryTitleIDCore';
import { filterToQueryFinal } from '../misc/filterToQueryFinal';
import type { DBType } from '$lib/server/db/db';
import { processNoteTextFilter } from './noteTextFilter';
import type { NoteFilterSchemaWithoutPaginationType } from '$lib/schema/noteSchema';
import { inArrayWrapped } from '../misc/inArrayWrapped';
import { noteFileRelationshipQuery } from '../misc/noteFileRelationshipQuery';
import { arrayToText } from '../misc/arrayToText';

export const noteFilterToQuery = (filter: NoteFilterSchemaWithoutPaginationType) => {
	const restFilter = processNoteTextFilter.process(filter);

	const where: SQL<unknown>[] = [];

	//Note that the "Title' column isn't really used
	idTitleFilterToQueryMapped({
		where,
		filter: restFilter,
		idColumn: notesTable.id,
		titleColumn: notesTable.note
	});
	if (restFilter.noteArray && restFilter.noteArray.length > 0) {
		where.push(inArrayWrapped(notesTable.note, restFilter.noteArray));
	}
	if (restFilter.excludeNoteArray && restFilter.excludeNoteArray.length > 0) {
		where.push(not(inArrayWrapped(notesTable.note, restFilter.excludeNoteArray)));
	}
	if (restFilter.typeArray && restFilter.typeArray.length > 0) {
		where.push(inArrayWrapped(notesTable.type, restFilter.typeArray));
	}
	if (restFilter.excludeTypeArray && restFilter.excludeTypeArray.length > 0) {
		where.push(not(inArrayWrapped(notesTable.type, restFilter.excludeTypeArray)));
	}
	noteFileRelationshipQuery({
		where,
		filter: restFilter,
		table: notesTable
	});

	return where;
};

export const noteFilterToText = async ({
	db,
	filter,
	prefix,
	allText = true
}: {
	db: DBType;
	filter: NoteFilterSchemaWithoutPaginationType;
	prefix?: string;
	allText?: boolean;
}) => {
	const restFilter = processNoteTextFilter.process(filter);

	const stringArray: string[] = [];
	if (restFilter.noteArray && restFilter.noteArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.noteArray,
				singularName: 'Note',
				midText: 'contains'
			})
		);
	}
	if (restFilter.excludeNoteArray && restFilter.excludeNoteArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.excludeNoteArray,
				singularName: 'Note',
				midText: 'does not contain'
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

	return filterToQueryFinal({ stringArray, allText, prefix });
};
