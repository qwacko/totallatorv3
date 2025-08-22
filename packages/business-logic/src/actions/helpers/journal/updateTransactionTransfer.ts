import { and, eq } from 'drizzle-orm';

import type { DBType } from '@totallator/database';
import { journalEntry } from '@totallator/database';
import type { AccountTypeEnumType } from '@totallator/shared';

import { dbExecuteLogger } from '@/server/db/dbLogger';

import { inArrayWrapped } from '../misc/inArrayWrapped';

type GroupedJournals = {
	id: string;
	journals: {
		id: string;
		transfer: boolean;
		account: {
			type: AccountTypeEnumType;
		};
	}[];
}[];

const doManyTransferUpdate = async ({
	db,
	groupedJournals
}: {
	db: DBType;
	groupedJournals: GroupedJournals;
}) => {
	let transferTransactions: string[] = [];
	let nonTransferTransactions: string[] = [];

	groupedJournals.forEach(({ id: transactionId, journals }) => {
		const isTransfer = journals.reduce(
			(prev, current) =>
				current.account.type === 'asset' || current.account.type === 'liability' ? prev : false,
			true
		);

		if (isTransfer) {
			transferTransactions.push(transactionId);
		} else {
			nonTransferTransactions.push(transactionId);
		}
	});

	if (transferTransactions.length > 0) {
		await dbExecuteLogger(
			db
				.update(journalEntry)
				.set({ transfer: true })
				.where(
					and(
						inArrayWrapped(journalEntry.transactionId, transferTransactions),
						eq(journalEntry.transfer, false)
					)
				),
			'Journals - Update Transaction Transfer Setting True'
		);
	}

	if (nonTransferTransactions.length > 0) {
		await dbExecuteLogger(
			db
				.update(journalEntry)
				.set({ transfer: false })
				.where(
					and(
						inArrayWrapped(journalEntry.transactionId, nonTransferTransactions),
						eq(journalEntry.transfer, true)
					)
				),
			'Journals - Update Transaction Transfer Setting False'
		);
	}
};

export const updateTransactionTransfer = async ({
	transactionId,
	db
}: {
	transactionId: string;
	db: DBType;
}) => {
	await updateManyTransferInfo({ db, transactionIds: [transactionId] });
};

export const updateManyTransferInfo = async ({
	db,
	transactionIds
}: {
	db: DBType;
	transactionIds?: string[];
}) => {
	const journals2 = await dbExecuteLogger(
		db.query.transaction.findMany({
			where: (transaction) =>
				transactionIds ? inArrayWrapped(transaction.id, transactionIds) : undefined,
			with: {
				journals: {
					with: {
						account: {
							columns: {
								type: true
							}
						}
					},
					columns: {
						id: true,
						transfer: true
					}
				}
			},
			columns: {
				id: true
			}
		}),
		'Transaction - Update Many Transfer Info'
	);

	await doManyTransferUpdate({ db, groupedJournals: journals2 });
};
