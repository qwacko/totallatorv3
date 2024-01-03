import type { TagFilterSchemaType } from '$lib/schema/tagSchema';
import type { DBType } from '../../../db';
import { tag } from '../../../postgres/schema';
import { SQL, eq } from 'drizzle-orm';
import { summaryFilterToQuery, summaryFilterToText } from '../summary/summaryFilterToQuery';
import { idTitleFilterToQuery, idTitleFilterToText } from '../misc/filterToQueryTitleIDCore';
import { statusFilterToQuery, statusFilterToText } from '../misc/filterToQueryStatusCore';
import { importFilterToQuery, importFilterToText } from '../misc/filterToQueryImportCore';
import { filterToQueryFinal } from '../misc/filterToQueryFinal';

export const tagFilterToQuery = (
	filter: Omit<TagFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>,
	includeSummary: boolean = false
) => {
	const restFilter = filter;

	const where: SQL<unknown>[] = [];
	idTitleFilterToQuery(where, filter, 'tag');
	statusFilterToQuery(where, filter, 'tag');
	importFilterToQuery(where, filter, 'tag');

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
