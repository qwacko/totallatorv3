import { eq } from 'drizzle-orm';

import {
	type AccountTableType,
	type BillTableType,
	type BudgetTableType,
	type CategoryTableType,
	type ImportItemDetailTableType,
	importTable,
	type ImportTableType,
	type JournalTableType,
	type LabelTableType,
	type TagTableType
} from '@totallator/database';
import type { DBType } from '@totallator/database';
import type { importTypeType } from '@totallator/shared';

import { dbExecuteLogger } from '@/server/db/dbLogger';

export const getImportDetail = async ({
	db,
	id
}: {
	db: DBType;
	id: string;
}): Promise<GetImportDetailReturnType> => {
	const returnData = await dbExecuteLogger(
		db.query.importTable.findFirst({
			where: eq(importTable.id, id),
			with: {
				importDetails: {
					with: {
						journal: true,
						journal2: true,
						bill: true,
						budget: true,
						category: true,
						tag: true,
						label: true,
						account: true
					}
				}
			}
		}),
		'getImportDetail'
	);

	if (!returnData) {
		throw new Error('Error Retrieving Import Details');
	}

	const linkedItemStatus = returnData.importDetails.reduce(
		(prev, current) => {
			const currentStatus = current.status;
			return {
				...prev,
				[currentStatus]: prev[currentStatus] + 1,
				all: prev.all + 1
			};
		},
		{
			error: 0,
			importError: 0,
			duplicate: 0,
			processed: 0,
			imported: 0,
			all: 0
		}
	);

	const linkedItemCount = returnData.importDetails.reduce(
		(prev, current) =>
			prev +
			Number(current.journal) +
			Number(current.journal2) +
			Number(current.bill) +
			Number(current.budget) +
			Number(current.category) +
			Number(current.tag) +
			Number(current.label) +
			Number(current.account),
		0
	);

	return {
		type: returnData.type,
		detail: returnData,
		linkedItemCount,
		linkedItemStatus
	};
};

export type GetImportDetailReturnType = {
	type: importTypeType;
	detail: ImportTableType & {
		importDetails: (ImportItemDetailTableType & {
			journal: JournalTableType | null;
			journal2: JournalTableType | null;
			bill: BillTableType | null;
			budget: BudgetTableType | null;
			category: CategoryTableType | null;
			tag: TagTableType | null;
			label: LabelTableType | null;
			account: AccountTableType | null;
		})[];
	};
	linkedItemCount: number;
	linkedItemStatus: {
		error: number;
		importError: number;
		duplicate: number;
		processed: number;
		imported: number;
		all: number;
	};
};
