import type { LabelFilterSchemaType } from '$lib/schema/labelSchema';

import { journalEntry, label, labelsToJournals } from '../../../postgres/schema';
import { SQL, and, eq } from 'drizzle-orm';
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
import type { DBType } from '$lib/server/db/db';
import { labelMaterializedView } from '$lib/server/db/postgres/schema/materializedViewSchema';
import { processLabelTextFilter } from './labelTextFilter';
import { linkedFileFilterQuery, linkedFileFilterToText } from '../file/fileFilterToQuery';
import { linkedNoteFilterQuery, linkedNoteFilterToText } from '../note/noteFilterToQuery';

export const labelFilterToQuery = (
	filter: Omit<LabelFilterSchemaType, 'pageNo' | 'pageSize' | 'orderBy'>,
	includeSummary: boolean = false
) => {
	const restFilter = processLabelTextFilter.process(filter);

	const where: SQL<unknown>[] = [];
	idTitleFilterToQueryMapped({
		where,
		filter: restFilter,
		idColumn: labelMaterializedView.id,
		titleColumn: labelMaterializedView.title
	});
	statusFilterToQueryMapped({
		where,
		filter: restFilter,
		statusColumn: labelMaterializedView.status,
		disabledColumn: labelMaterializedView.disabled,
		activeColumn: labelMaterializedView.active,
		allowUpdateColumn: labelMaterializedView.allowUpdate
	});
	importFilterToQueryMaterialized({
		where,
		filter: restFilter,
		table: {
			importId: labelMaterializedView.importId,
			importDetailId: labelMaterializedView.importDetailId
		}
	});

	if (includeSummary) {
		linkedFileFilterQuery({
			where,
			filter: restFilter,
			fileCountColumn: labelMaterializedView.fileCount
		});
		linkedNoteFilterQuery({
			where,
			filter: restFilter,
			noteCountColumn: labelMaterializedView.noteCount,
			reminderCountColumn: labelMaterializedView.reminderCount
		});
		summaryFilterToQueryMaterialized({
			where,
			filter: restFilter,
			table: {
				count: labelMaterializedView.count,
				sum: labelMaterializedView.sum,
				firstDate: labelMaterializedView.firstDate,
				lastDate: labelMaterializedView.lastDate
			}
		});
	}

	return where;
};

export const labelFilterToSubQuery = ({
	filter,
	includeSummary = false,
	db
}: {
	db: DBType;
	filter: Omit<LabelFilterSchemaType, 'pageNo' | 'pageSize' | 'orderBy'>;
	includeSummary?: boolean;
}) => {
	const restFilter = processLabelTextFilter.process(filter);

	const labelFilter = labelFilterToQuery(restFilter, includeSummary);
	const labelIdsSubquery = db
		.select({ id: journalEntry.id })
		.from(labelsToJournals)
		.leftJoin(labelMaterializedView, eq(labelMaterializedView.id, labelsToJournals.labelId))
		.leftJoin(journalEntry, eq(journalEntry.id, labelsToJournals.journalId))
		.where(and(...labelFilter));

	return labelIdsSubquery;
};

export const labelIdToTitle = async (db: DBType, id: string) => {
	const foundLabel = await db
		.select({ title: label.title })
		.from(label)
		.where(eq(label.id, id))
		.limit(1)
		.execute();

	if (foundLabel?.length === 1) {
		return foundLabel[0].title;
	}
	return id;
};

export const labelIdsToTitle = async (db: DBType, ids: string[]) => {
	const titles = await Promise.all(ids.map(async (id) => labelIdToTitle(db, id)));

	return titles;
};

export const labelFilterToText = async ({
	db,
	filter,
	prefix,
	allText = true
}: {
	db: DBType;
	filter: Omit<LabelFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>;
	prefix?: string;
	allText?: boolean;
}) => {
	const restFilter = processLabelTextFilter.process(filter);

	const stringArray: string[] = [];
	await idTitleFilterToText(db, stringArray, restFilter, labelIdToTitle);
	statusFilterToText(stringArray, restFilter);
	linkedFileFilterToText(restFilter, stringArray);
	linkedNoteFilterToText(restFilter, stringArray);
	importFilterToText(db, stringArray, restFilter);
	summaryFilterToText({ stringArray, filter: restFilter });
	return filterToQueryFinal({ stringArray, allText, prefix });
};
