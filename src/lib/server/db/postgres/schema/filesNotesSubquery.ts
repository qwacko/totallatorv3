import { eq, count, isNotNull, and } from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/pg-core';
import { fileTable, notesTable } from './transactionSchema';
import type { KeysOfCreateFileNoteRelationshipSchemaType } from '$lib/schema/helpers/fileNoteRelationship';

export const filesNotesSubquery = (
	qb: QueryBuilder,
	target: KeysOfCreateFileNoteRelationshipSchemaType
) => {
	const withFileQuery = qb.$with('filessq').as(
		qb
			.select({
				id: fileTable[target],
				fileCount: count(fileTable.id).as('file_count')
			})
			.from(fileTable)
			.where(isNotNull(fileTable[target]))
			.groupBy(fileTable[target])
	);

	const withNoteQuery = qb.$with('notessq').as(
		qb
			.select({
				id: notesTable[target],
				noteCount: count(notesTable.id).as('note_count')
			})
			.from(notesTable)
			.where(isNotNull(notesTable[target]))
			.groupBy(notesTable[target])
	);

	const withReminderQuery = qb.$with('reminderssq').as(
		qb
			.select({
				id: notesTable[target],
				reminderCount: count(notesTable.id).as('reminder_count')
			})
			.from(notesTable)
			.where(and(eq(notesTable.type, 'reminder'), isNotNull(notesTable[target])))
			.groupBy(notesTable[target])
	);

	return { withFileQuery, withNoteQuery, withReminderQuery };
};
