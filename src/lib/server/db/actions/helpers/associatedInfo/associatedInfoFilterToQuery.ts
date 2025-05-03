import type { DBType } from '../../../db';
import { associatedInfoTable } from '../../../postgres/schema';
import { SQL, eq } from 'drizzle-orm';
import { idTitleFilterToQueryMapped, idTitleFilterToText } from '../misc/filterToQueryTitleIDCore';
import { filterToQueryFinal } from '../misc/filterToQueryFinal';
import { dbExecuteLogger } from '$lib/server/db/dbLogger';
import type { AssociatedInfoFilterSchemaType } from '$lib/schema/associatedInfoSchema';
import { processAssociatedInfoTextFilter } from './associatedInfoTextFilter';

export const associatedInfoFilterToQuery = ({
	filter
}: {
	filter: AssociatedInfoFilterSchemaType;
}) => {
	const where: SQL<unknown>[] = [];
	idTitleFilterToQueryMapped({
		where,
		filter,
		idColumn: associatedInfoTable.id,
		titleColumn: associatedInfoTable.title
	});

	return where;
};

export const assciatedInfoToTitle = async (db: DBType, id: string) => {
	const foundAssociatedInfo = await dbExecuteLogger(
		db
			.select({ title: associatedInfoTable.title })
			.from(associatedInfoTable)
			.where(eq(associatedInfoTable.id, id))
			.limit(1),
		'associatedInfoIdToTitle'
	);

	if (foundAssociatedInfo?.length === 1) {
		const firstFoundAssociatedInfo = foundAssociatedInfo[0];
		if (firstFoundAssociatedInfo?.title) {
			return firstFoundAssociatedInfo.title;
		}
	}
	return id;
};

export const associatedInfoFilterToText = async ({
	db,
	filter,
	prefix,
	allText = true
}: {
	db: DBType;
	filter: AssociatedInfoFilterSchemaType;
	prefix?: string;
	allText?: boolean;
}) => {
	const restFilter = processAssociatedInfoTextFilter.process(filter);

	const stringArray: string[] = [];
	await idTitleFilterToText(db, stringArray, restFilter, assciatedInfoToTitle);

	return filterToQueryFinal({ stringArray, allText, prefix });
};
