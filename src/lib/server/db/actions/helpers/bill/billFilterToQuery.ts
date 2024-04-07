import type { BillFilterSchemaWithoutPaginationType } from '$lib/schema/billSchema';
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
import { processBillTextFilter } from './billTextFilter';

export const billFilterToQuery = ({
	filter,
	target = 'bill'
}: {
	filter: BillFilterSchemaWithoutPaginationType;
	target?: 'materializedJournals' | 'bill' | 'billWithSummary';
}) => {
	const restFilter = processBillTextFilter.process(filter);
	const includeSummary = target === 'billWithSummary';
	const materializedJournals = target === 'materializedJournals';

	const where: SQL<unknown>[] = [];
	idTitleFilterToQueryMapped({
		where,
		filter: restFilter,
		idColumn: materializedJournals ? journalExtendedView.billId : billMaterializedView.id,
		titleColumn: materializedJournals ? journalExtendedView.billTitle : billMaterializedView.title
	});
	statusFilterToQueryMapped({
		where,
		filter: restFilter,
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
			filter: restFilter,
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
	filter: BillFilterSchemaWithoutPaginationType;
	prefix?: string;
	allText?: boolean;
}) => {
	const restFilter = processBillTextFilter.process(filter);

	const stringArray: string[] = [];
	await idTitleFilterToText(db, stringArray, restFilter, billIdToTitle);
	statusFilterToText(stringArray, restFilter);
	importFilterToText(db, stringArray, restFilter);
	summaryFilterToText({ stringArray, filter: restFilter });
	return filterToQueryFinal({ stringArray, allText, prefix });
};
