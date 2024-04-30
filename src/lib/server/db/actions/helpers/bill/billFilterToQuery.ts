import type { BillFilterSchemaWithoutPaginationType } from '$lib/schema/billSchema';
import type { DBType } from '../../../db';
import { bill } from '../../../postgres/schema';
import {
	billMaterializedView,
	journalExtendedView,
	journalView
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
import { linkedFileFilterQuery, linkedFileFilterToText } from '../file/fileFilterToQuery';
import { linkedNoteFilterQuery, linkedNoteFilterToText } from '../note/noteFilterToQuery';
import { dbExecuteLogger } from '$lib/server/db/dbLogger';

export const billFilterToQuery = ({
	filter,
	target = 'bill'
}: {
	filter: BillFilterSchemaWithoutPaginationType;
	target?: 'materializedJournals' | 'bill' | 'billWithSummary' | 'viewJournals';
}) => {
	const restFilter = processBillTextFilter.process(filter);
	const includeSummary = target === 'billWithSummary';
	const viewJournals = target === 'viewJournals';
	const materializedJournals = target === 'materializedJournals';

	const targetTable = viewJournals
		? {
				id: journalView.billId,
				title: journalView.billTitle,
				status: journalView.billStatus,
				disabled: journalView.billDisabled,
				allowUpdate: journalView.billAllowUpdate,
				active: journalView.billActive
			}
		: materializedJournals
			? {
					id: journalExtendedView.billId,
					title: journalExtendedView.billTitle,
					status: journalExtendedView.billStatus,
					disabled: journalExtendedView.billDisabled,
					allowUpdate: journalExtendedView.billAllowUpdate,
					active: journalExtendedView.billActive
				}
			: billMaterializedView;

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
	if (!materializedJournals && !viewJournals) {
		importFilterToQueryMaterialized({
			where,
			filter: restFilter,
			table: {
				importId: billMaterializedView.importId,
				importDetailId: billMaterializedView.importDetailId
			}
		});
	}

	if (includeSummary && !viewJournals && !materializedJournals) {
		linkedFileFilterQuery({
			where,
			filter: restFilter,
			fileCountColumn: billMaterializedView.fileCount
		});
		linkedNoteFilterQuery({
			where,
			filter: restFilter,
			noteCountColumn: billMaterializedView.noteCount,
			reminderCountColumn: billMaterializedView.reminderCount
		});
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
	const foundBill = await dbExecuteLogger(
		db.select({ title: bill.title }).from(bill).where(eq(bill.id, id)).limit(1),
		'billIdToTitle'
	);

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
	linkedFileFilterToText(restFilter, stringArray);
	linkedNoteFilterToText(restFilter, stringArray);
	importFilterToText(db, stringArray, restFilter);
	summaryFilterToText({ stringArray, filter: restFilter });
	return filterToQueryFinal({ stringArray, allText, prefix });
};
