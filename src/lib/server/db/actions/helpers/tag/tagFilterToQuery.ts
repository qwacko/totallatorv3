import type { TagFilterSchemaType } from '$lib/schema/tagSchema';
import type { DBType } from '../../../db';
import { tag } from '../../../postgres/schema';
import {
	journalExtendedView,
	tagMaterializedView
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
		idColumn: materializedJournals ? journalExtendedView.tagId : tagMaterializedView.id,
		titleColumn: materializedJournals ? journalExtendedView.tagTitle : tagMaterializedView.title,
		groupColumn: materializedJournals ? journalExtendedView.tagGroup : tagMaterializedView.group,
		singleColumn: materializedJournals ? journalExtendedView.tagSingle : tagMaterializedView.single
	});
	statusFilterToQueryMapped({
		where,
		filter,
		statusColumn: materializedJournals ? journalExtendedView.tagStatus : tagMaterializedView.status,
		disabledColumn: materializedJournals
			? journalExtendedView.tagDisabled
			: tagMaterializedView.disabled,
		activeColumn: materializedJournals ? journalExtendedView.tagActive : tagMaterializedView.active,
		allowUpdateColumn: materializedJournals
			? journalExtendedView.tagAllowUpdate
			: tagMaterializedView.allowUpdate
	});

	if (!materializedJournals) {
		importFilterToQueryMaterialized({
			where,
			filter,
			table: {
				importId: tagMaterializedView.importId,
				importDetailId: tagMaterializedView.importDetailId
			}
		});
	}

	if (includeSummary) {
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
