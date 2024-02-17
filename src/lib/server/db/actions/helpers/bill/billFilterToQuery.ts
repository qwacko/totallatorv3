import type { BillFilterSchemaType } from '$lib/schema/billSchema';
import type { DBType } from '../../../db';
import { bill } from '../../../postgres/schema';
import {
	billMaterializedView,
	journalExtendedView
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
		idColumn: materializedJournals ? journalExtendedView.billId : billMaterializedView.id,
		titleColumn: materializedJournals ? journalExtendedView.billTitle : billMaterializedView.title
	});
	statusFilterToQueryMapped({
		where,
		filter,
		statusColumn: materializedJournals
			? journalExtendedView.billStatus
			: billMaterializedView.status,
		disabledColumn: materializedJournals
			? journalExtendedView.billDisabled
			: billMaterializedView.disabled,
		activeColumn: materializedJournals
			? journalExtendedView.billActive
			: billMaterializedView.active,
		allowUpdateColumn: materializedJournals
			? journalExtendedView.billAllowUpdate
			: billMaterializedView.allowUpdate
	});
	if (!materializedJournals) {
		importFilterToQueryMaterialized({
			where,
			filter,
			table: {
				importId: billMaterializedView.importId,
				importDetailId: billMaterializedView.importDetailId
			}
		});
	}

	if (includeSummary) {
		summaryFilterToQueryMaterialized({
			where,
			filter: restFilter,
			table: {
				count: billMaterializedView.count,
				sum: billMaterializedView.sum,
				firstDate: billMaterializedView.firstDate,
				lastDate: billMaterializedView.lastDate
			}
		});
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
