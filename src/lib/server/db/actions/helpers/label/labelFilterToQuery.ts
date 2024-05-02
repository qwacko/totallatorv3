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
import {
	labelMaterializedView,
	labelView
} from '$lib/server/db/postgres/schema/materializedViewSchema';
import { processLabelTextFilter } from './labelTextFilter';
import { linkedFileFilterQuery, linkedFileFilterToText } from '../file/fileFilterToQuery';
import { linkedNoteFilterQuery, linkedNoteFilterToText } from '../note/noteFilterToQuery';
import { dbExecuteLogger } from '$lib/server/db/dbLogger';

export const labelFilterToQuery = ({
	filter,
	target = 'view'
}: {
	filter: Omit<LabelFilterSchemaType, 'pageNo' | 'pageSize' | 'orderBy'>;
	target: 'view' | 'materialized' | 'original';
}) => {
	const includeSummary = target === 'materialized' || target === 'view';
	const restFilter = processLabelTextFilter.process(filter);

	const targetTable =
		target === 'original' ? label : target === 'view' ? labelView : labelMaterializedView;

	const where: SQL<unknown>[] = [];
	idTitleFilterToQueryMapped({
		where,
		filter: restFilter,
		idColumn: targetTable.id,
		titleColumn: targetTable.title
	});
	statusFilterToQueryMapped({
		where,
		filter: restFilter,
		statusColumn: targetTable.status,
		disabledColumn: targetTable.disabled,
		activeColumn: targetTable.active,
		allowUpdateColumn: targetTable.allowUpdate
	});
	importFilterToQueryMaterialized({
		where,
		filter: restFilter,
		table: {
			importId: targetTable.importId,
			importDetailId: targetTable.importDetailId
		}
	});

	if (includeSummary) {
		const summaryTable = target === 'view' ? labelView : labelMaterializedView;

		linkedFileFilterQuery({
			where,
			filter: restFilter,
			fileCountColumn: summaryTable.fileCount
		});
		linkedNoteFilterQuery({
			where,
			filter: restFilter,
			noteCountColumn: summaryTable.noteCount,
			reminderCountColumn: summaryTable.reminderCount
		});
		summaryFilterToQueryMaterialized({
			where,
			filter: restFilter,
			table: {
				count: summaryTable.count,
				sum: summaryTable.sum,
				firstDate: summaryTable.firstDate,
				lastDate: summaryTable.lastDate
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

	const labelFilter = labelFilterToQuery({ filter: restFilter, target: 'materialized' });
	const labelIdsSubquery = db
		.select({ id: journalEntry.id })
		.from(labelsToJournals)
		.leftJoin(labelMaterializedView, eq(labelMaterializedView.id, labelsToJournals.labelId))
		.leftJoin(journalEntry, eq(journalEntry.id, labelsToJournals.journalId))
		.where(and(...labelFilter));

	return labelIdsSubquery;
};

export const labelIdToTitle = async (db: DBType, id: string) => {
	const foundLabel = await dbExecuteLogger(
		db.select({ title: label.title }).from(label).where(eq(label.id, id)).limit(1),
		'Label ID to Title'
	);

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
