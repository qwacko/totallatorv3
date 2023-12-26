import { eq } from 'drizzle-orm';
import { importTable } from '../../../postgres/schema';
import type { DBType } from '../../../db';

export const getImportDetail = async ({ db, id }: { db: DBType; id: string }) => {
	const returnData = await db.query.importTable
		.findFirst({
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
		})
		.execute();

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
		{ error: 0, importError: 0, duplicate: 0, processed: 0, imported: 0, all: 0 }
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
