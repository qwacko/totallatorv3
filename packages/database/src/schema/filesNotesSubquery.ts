import { eq, count, isNotNull, and } from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/pg-core';
import { associatedInfoTable, fileTable, notesTable } from './transactionSchema';
import type { KeysOfCreateFileNoteRelationshipSchemaType } from '@totallator/shared';

export const filesNotesSubquery = (
	qb: QueryBuilder,
	target: KeysOfCreateFileNoteRelationshipSchemaType
) => {
	const withFileQuery = qb.$with('filessq').as(
		qb
			.select({
				id: associatedInfoTable[target],
				fileCount: count(fileTable.id).as('file_count')
			})
			.from(fileTable)
			.leftJoin(associatedInfoTable, eq(fileTable.associatedInfoId, associatedInfoTable.id))
			.where(isNotNull(associatedInfoTable[target]))
			.groupBy(associatedInfoTable[target])
	);

	const withNoteQuery = qb.$with('notessq').as(
		qb
			.select({
				id: associatedInfoTable[target],
				noteCount: count(notesTable.id).as('note_count')
			})
			.from(notesTable)
			.leftJoin(associatedInfoTable, eq(notesTable.associatedInfoId, associatedInfoTable.id))
			.where(isNotNull(associatedInfoTable[target]))
			.groupBy(associatedInfoTable[target])
	);

	const withReminderQuery = qb.$with('reminderssq').as(
		qb
			.select({
				id: associatedInfoTable[target],
				reminderCount: count(notesTable.id).as('reminder_count')
			})
			.from(notesTable)
			.leftJoin(associatedInfoTable, eq(notesTable.associatedInfoId, associatedInfoTable.id))
			.where(and(eq(notesTable.type, 'reminder'), isNotNull(associatedInfoTable[target])))
			.groupBy(associatedInfoTable[target])
	);

	return { withFileQuery, withNoteQuery, withReminderQuery };
};
