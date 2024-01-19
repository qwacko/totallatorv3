import type { TagFilterSchemaType } from '$lib/schema/tagSchema';
import type { DBType } from '../../../db';
import { journalExtendedView, tag } from '../../../postgres/schema';
import { SQL, eq } from 'drizzle-orm';
import { summaryFilterToQuery, summaryFilterToText } from '../summary/summaryFilterToQuery';
import { idTitleFilterToQueryMapped, idTitleFilterToText } from '../misc/filterToQueryTitleIDCore';
import { statusFilterToQueryMapped, statusFilterToText } from '../misc/filterToQueryStatusCore';
import { importFilterToQuery, importFilterToText } from '../misc/filterToQueryImportCore';
import { filterToQueryFinal } from '../misc/filterToQueryFinal';

export const tagFilterToQuery = ({
	filter,
	target = 'tag'
}: {
	filter: Omit<TagFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>;
	target?: 'tag' | 'tagWithSummary' | 'materializedJournals';
}) => {
	const restFilter = filter;
	const includeSummary = target === 'tagWithSummary';
	const materializedJournals = target === 'materializedJournals';

	const where: SQL<unknown>[] = [];
	idTitleFilterToQueryMapped({
		where,
		filter,
		idColumn: materializedJournals ? journalExtendedView.tagId : tag.id,
		titleColumn: materializedJournals ? journalExtendedView.tagTitle : tag.title,
		groupColumn: materializedJournals ? journalExtendedView.tagGroup : tag.group,
		singleColumn: materializedJournals ? journalExtendedView.tagSingle : tag.single
	});
	statusFilterToQueryMapped({
		where,
		filter,
		statusColumn: materializedJournals ? journalExtendedView.tagStatus : tag.status,
		disabledColumn: materializedJournals ? journalExtendedView.tagDisabled : tag.disabled,
		activeColumn: materializedJournals ? journalExtendedView.tagActive : tag.active,
		allowUpdateColumn: materializedJournals ? journalExtendedView.tagAllowUpdate : tag.allowUpdate
	});

	if (!materializedJournals) {
		importFilterToQuery(where, filter, 'tag');
	}

	if (includeSummary) {
		summaryFilterToQuery({ where, filter: restFilter });
	}

	return where;
};

export const tagIdToTitle = async (db: DBType, id: string) => {
	const foundTag = await db
		.select({ title: tag.title })
		.from(tag)
		.where(eq(tag.id, id))
		.limit(1)
		.execute();

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
	filter: Omit<TagFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>;
	prefix?: string;
	allText?: boolean;
}) => {
	const restFilter = filter;

	const stringArray: string[] = [];
	await idTitleFilterToText(db, stringArray, filter, tagIdToTitle);
	statusFilterToText(stringArray, filter);
	importFilterToText(db, stringArray, filter);
	summaryFilterToText({ stringArray, filter: restFilter });
	return filterToQueryFinal({ stringArray, allText, prefix });
};
