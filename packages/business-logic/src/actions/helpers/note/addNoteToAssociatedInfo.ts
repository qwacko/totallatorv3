import { nanoid } from 'nanoid';

import { getContextDB } from '@totallator/context';
import { notesTable } from '@totallator/database';
import { CreateNoteSchemaCoreType } from '@totallator/shared';

import { materializedViewActions } from '@/actions/materializedViewActions';
import { dbExecuteLogger } from '@/server/db/dbLogger';

import { updatedTime } from '../misc/updatedTime';

export const addNoteToAssociatedInfo = async ({
	data,
	associatedId
}: {
	data: CreateNoteSchemaCoreType;
	associatedId: string;
}) => {
	const db = getContextDB();
	const noteId = nanoid();

	const insertNoteData: typeof notesTable.$inferInsert = {
		id: noteId,
		associatedInfoId: associatedId,
		note: data.note,
		type: data.type,
		...updatedTime()
	};

	await dbExecuteLogger(db.insert(notesTable).values(insertNoteData), 'Note - Create - Note');

	await materializedViewActions.setRefreshRequired();
};
