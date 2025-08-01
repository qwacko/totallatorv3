import { notesTable } from '@totallator/database';
import { SQL, not, gt, isNull } from 'drizzle-orm';
import { idTitleFilterToQueryMapped } from '../misc/filterToQueryTitleIDCore';
import { filterToQueryFinal } from '../misc/filterToQueryFinal';
import { processNoteTextFilter } from './noteTextFilter';
import type { NoteFilterSchemaWithoutPaginationType } from '@totallator/shared';
import type { LinkedNoteFilterSchemaType } from '@totallator/shared';
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
		filter: restFilter
	});

	return where;
};

export const noteFilterToText = async ({
	filter,
	prefix,
	allText = true
}: {
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

export const linkedNoteFilterToText = (data: LinkedNoteFilterSchemaType, stringArray: string[]) => {
	if (data.note !== undefined) stringArray.push(`Has ${data.note ? 'A' : 'No'} Linked Note`);
	if (data.reminder !== undefined)
		stringArray.push(`Has ${data.reminder ? 'A' : 'No'} Reminder Note`);
};

export const linkedNoteFilterQuery = ({
	filter,
	where,
	noteCountColumn,
	reminderCountColumn
}: {
	filter: LinkedNoteFilterSchemaType;
	where: SQL<unknown>[];
	noteCountColumn: SQL.Aliased<number>;
	reminderCountColumn: SQL.Aliased<number>;
}) => {
	if (filter.note !== undefined) {
		if (filter.note) {
			where.push(gt(noteCountColumn, 0));
		}
		if (!filter.note) {
			where.push(isNull(noteCountColumn));
		}
	}
	if (filter.reminder !== undefined) {
		if (filter.reminder) {
			where.push(gt(reminderCountColumn, 0));
		}
		if (!filter.reminder) {
			where.push(isNull(reminderCountColumn));
		}
	}
};
