import type { BillFilterSchemaType } from '$lib/schema/billSchema';
import type { DBType } from '../../../db';
import { bill } from '../../../schema';
import { SQL, eq } from 'drizzle-orm';
import { summaryFilterToQuery, summaryFilterToText } from '../summary/summaryFilterToQuery';
import { idTitleFilterToQuery, idTitleFilterToText } from '../misc/filterToQueryTitleIDCore';
import { statusFilterToQuery, statusFilterToText } from '../misc/filterToQueryStatusCore';
import { importFilterToQuery, importFilterToText } from '../misc/filterToQueryImportCore';
import { filterToQueryFinal } from '../misc/filterToQueryFinal';

export const billFilterToQuery = (
	filter: Omit<BillFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>,
	includeSummary: boolean = false
) => {
	const restFilter = filter;

	const where: SQL<unknown>[] = [];
	idTitleFilterToQuery(where, filter, 'bill');
	statusFilterToQuery(where, filter, 'bill');
	importFilterToQuery(where, filter, 'bill');

	if (includeSummary) {
		summaryFilterToQuery({ where, filter: restFilter });
	}

	return where;
};

export const billIdToTitle = async (db: DBType, id: string) => {
	const foundBill = await db
		.select({ title: bill.title })
		.from(bill)
		.where(eq(bill.id, id))
		.limit(1)
		.execute();

	if (foundBill?.length === 1) {
		return foundBill[0].title;
	}
	return id;
};

export const billFilterToText = async ({
	db,
	filter,
	prefix,
	allText = true
}: {
	db: DBType;
	filter: Omit<BillFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>;
	prefix?: string;
	allText?: boolean;
}) => {
	const restFilter = filter;

	const stringArray: string[] = [];
	await idTitleFilterToText(db, stringArray, filter, billIdToTitle);
	statusFilterToText(stringArray, filter);
	importFilterToText(stringArray, filter);
	summaryFilterToText({ stringArray, filter: restFilter });
	return filterToQueryFinal({ stringArray, allText, prefix });
};
