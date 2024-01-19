import type { BillFilterSchemaType } from '$lib/schema/billSchema';
import type { DBType } from '../../../db';
import { bill, journalExtendedView } from '../../../postgres/schema';
import { SQL, eq } from 'drizzle-orm';
import { summaryFilterToQuery, summaryFilterToText } from '../summary/summaryFilterToQuery';
import { idTitleFilterToQueryMapped, idTitleFilterToText } from '../misc/filterToQueryTitleIDCore';
import { statusFilterToQueryMapped, statusFilterToText } from '../misc/filterToQueryStatusCore';
import { importFilterToQuery, importFilterToText } from '../misc/filterToQueryImportCore';
import { filterToQueryFinal } from '../misc/filterToQueryFinal';

export const billFilterToQuery = ({
	filter,
	target = 'bill'
}: {
	filter: Omit<BillFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>;
	target?: 'materializedJournals' | 'bill' | 'billWithSummary';
}) => {
	const restFilter = filter;
	const includeSummary = target === 'billWithSummary';
	const materializedJournals = target === 'materializedJournals';

	const where: SQL<unknown>[] = [];
	idTitleFilterToQueryMapped({
		where,
		filter,
		idColumn: materializedJournals ? journalExtendedView.billId : bill.id,
		titleColumn: materializedJournals ? journalExtendedView.billTitle : bill.title
	});
	statusFilterToQueryMapped({
		where,
		filter,
		statusColumn: materializedJournals ? journalExtendedView.billStatus : bill.status,
		disabledColumn: materializedJournals ? journalExtendedView.billDisabled : bill.disabled,
		activeColumn: materializedJournals ? journalExtendedView.billActive : bill.active,
		allowUpdateColumn: materializedJournals ? journalExtendedView.billAllowUpdate : bill.allowUpdate
	});
	if (!materializedJournals) {
		importFilterToQuery(where, filter, 'bill');
	}

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
	importFilterToText(db, stringArray, filter);
	summaryFilterToText({ stringArray, filter: restFilter });
	return filterToQueryFinal({ stringArray, allText, prefix });
};
