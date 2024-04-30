import type { TagFilterSchemaWithoutPaginationType } from '$lib/schema/tagSchema';
import type { DBType } from '../../../db';
import { tag } from '../../../postgres/schema';
import {
	journalExtendedView,
	tagMaterializedView,
	journalView
} from '../../../postgres/schema/materializedViewSchema';
import { SQL, eq } from 'drizzle-orm';
import {
	summaryFilterToQueryMaterialized,
	summaryFilterToText
} from '../summary/summaryFilterToQuery';
import { idTitleFilterToQueryMapped, idTitleFilterToText } from '../misc/filterToQueryTitleIDCore';
import { statusFilterToQueryMapped, statusFilterToText } from '../misc/filterToQueryStatusCore';
import {
	importFilterToQueryMaterialized,
	importFilterToText
} from '../misc/filterToQueryImportCore';
import { filterToQueryFinal } from '../misc/filterToQueryFinal';
import { processTagTextFilter } from './tagTextFilter';
import { linkedFileFilterQuery, linkedFileFilterToText } from '../file/fileFilterToQuery';
import { linkedNoteFilterQuery, linkedNoteFilterToText } from '../note/noteFilterToQuery';
import { dbExecuteLogger } from '$lib/server/db/dbLogger';

export const tagFilterToQuery = ({
	filter,
	target = 'tag'
}: {
	filter: TagFilterSchemaWithoutPaginationType;
	target?: 'tag' | 'tagWithSummary' | 'materializedJournals' | 'viewJournals';
}) => {
	const restFilter = processTagTextFilter.process(filter);
	const includeSummary = target === 'tagWithSummary';
	const viewJournals = target === 'viewJournals';
	const materializedJournals = target === 'materializedJournals';

	const targetTable = viewJournals
		? {
				id: journalView.tagId,
				title: journalView.tagTitle,
				single: journalView.tagSingle,
				group: journalView.tagGroup,
				status: journalView.tagStatus,
				disabled: journalView.tagDisabled,
				allowUpdate: journalView.tagAllowUpdate,
				active: journalView.tagActive
			}
		: materializedJournals
			? {
					id: journalExtendedView.tagId,
					title: journalExtendedView.tagTitle,
					single: journalExtendedView.tagSingle,
					group: journalExtendedView.tagGroup,
					status: journalExtendedView.tagStatus,
					disabled: journalExtendedView.tagDisabled,
					allowUpdate: journalExtendedView.tagAllowUpdate,
					active: journalExtendedView.tagActive
				}
			: tagMaterializedView;

	const where: SQL<unknown>[] = [];
	idTitleFilterToQueryMapped({
		where,
		filter: restFilter,
		idColumn: targetTable.id,
		titleColumn: targetTable.title,
		groupColumn: targetTable.group,
		singleColumn: targetTable.single
	});
	statusFilterToQueryMapped({
		where,
		filter: restFilter,
		statusColumn: targetTable.status,
		disabledColumn: targetTable.disabled,
		activeColumn: targetTable.active,
		allowUpdateColumn: targetTable.allowUpdate
	});

	if (!materializedJournals && !viewJournals) {
		importFilterToQueryMaterialized({
			where,
			filter: restFilter,
			table: {
				importId: tagMaterializedView.importId,
				importDetailId: tagMaterializedView.importDetailId
			}
		});
	}

	if (includeSummary && !viewJournals && !materializedJournals) {
		linkedFileFilterQuery({
			where,
			filter: restFilter,
			fileCountColumn: tagMaterializedView.fileCount
		});
		linkedNoteFilterQuery({
			where,
			filter: restFilter,
			noteCountColumn: tagMaterializedView.noteCount,
			reminderCountColumn: tagMaterializedView.reminderCount
		});
		summaryFilterToQueryMaterialized({
			where,
			filter: restFilter,
			table: {
				count: tagMaterializedView.count,
				sum: tagMaterializedView.sum,
				firstDate: tagMaterializedView.firstDate,
				lastDate: tagMaterializedView.lastDate
			}
		});
	}

	return where;
};

export const tagIdToTitle = async (db: DBType, id: string) => {
	const foundTag = await dbExecuteLogger(
		db.select({ title: tag.title }).from(tag).where(eq(tag.id, id)).limit(1),
		'Tag ID to Title'
	);

	if (foundTag?.length === 1) {
		return foundTag[0].title;
	}
	return id;
};

export const tagFilterToText = async ({
	db,
	filter,
	prefix,
	allText = true
}: {
	db: DBType;
	filter: TagFilterSchemaWithoutPaginationType;
	prefix?: string;
	allText?: boolean;
}) => {
	const restFilter = processTagTextFilter.process(filter);

	const stringArray: string[] = [];
	await idTitleFilterToText(db, stringArray, restFilter, tagIdToTitle);
	statusFilterToText(stringArray, restFilter);
	linkedFileFilterToText(restFilter, stringArray);
	linkedNoteFilterToText(restFilter, stringArray);
	importFilterToText(db, stringArray, restFilter);
	summaryFilterToText({ stringArray, filter: restFilter });
	return filterToQueryFinal({ stringArray, allText, prefix });
};
