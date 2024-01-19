import type { LabelFilterSchemaType } from '$lib/schema/labelSchema';

import { journalEntry, label, labelsToJournals } from '../../../postgres/schema';
import { SQL, and, eq } from 'drizzle-orm';
import { summaryFilterToQuery, summaryFilterToText } from '../summary/summaryFilterToQuery';
import { idTitleFilterToQuery, idTitleFilterToText } from '../misc/filterToQueryTitleIDCore';
import { statusFilterToQuery, statusFilterToText } from '../misc/filterToQueryStatusCore';
import { importFilterToQuery, importFilterToText } from '../misc/filterToQueryImportCore';
import { filterToQueryFinal } from '../misc/filterToQueryFinal';
import type { DBType } from '$lib/server/db/db';

export const labelFilterToQuery = (
	filter: Omit<LabelFilterSchemaType, 'pageNo' | 'pageSize' | 'orderBy'>,
	includeSummary: boolean = false
) => {
	const where: SQL<unknown>[] = [];
	idTitleFilterToQuery(where, filter, 'label');
	statusFilterToQuery(where, filter, 'label');
	importFilterToQuery(where, filter, 'label');

	if (includeSummary) {
		summaryFilterToQuery({ where, filter });
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
	const labelFilter = labelFilterToQuery(filter, includeSummary);
	const labelIdsSubquery = db
		.select({ id: journalEntry.id })
		.from(labelsToJournals)
		.leftJoin(label, eq(label.id, labelsToJournals.labelId))
		.where(and(...labelFilter))
		.as('label_sq');

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
	const restFilter = filter;

	const stringArray: string[] = [];
	await idTitleFilterToText(db, stringArray, filter, labelIdToTitle);
	statusFilterToText(stringArray, filter);
	importFilterToText(db, stringArray, filter);
	summaryFilterToText({ stringArray, filter: restFilter });
	return filterToQueryFinal({ stringArray, allText, prefix });
};
