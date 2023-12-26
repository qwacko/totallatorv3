import { eq, inArray } from 'drizzle-orm';
import type { DBType } from '../../../db';
import { account, journalEntry } from '../../../postgres/schema';
import type { AccountTypeEnumType } from '$lib/schema/accountTypeSchema';

const doTransferUpdate = async ({
	db,
	journals,
	transactionId
}: {
	db: DBType;
	journals: { id: string; transfer: boolean; accountType: AccountTypeEnumType | null }[];
	transactionId: string;
}) => {
	const isTransfer = journals.reduce(
		(prev, current) =>
			current.accountType === 'asset' || current.accountType === 'liability' ? prev : false,
		true
	);

	const journalTransferInfo = new Set(journals.map((item) => item.transfer));

	if (journalTransferInfo.size > 1 || journalTransferInfo.has(!isTransfer)) {
		await db
			.update(journalEntry)
			.set({ transfer: isTransfer })
			.where(eq(journalEntry.transactionId, transactionId))
			.execute();
	}
};

export const updateTransactionTransfer = async ({
	transactionId,
	db
}: {
	transactionId: string;
	db: DBType;
}) => {
	const journals = await db
		.select({ id: journalEntry.id, transfer: journalEntry.transfer, accountType: account.type })
		.from(journalEntry)
		.leftJoin(account, eq(account.id, journalEntry.accountId))
		.where(eq(journalEntry.transactionId, transactionId))
		.execute();

	await doTransferUpdate({ db, journals, transactionId });
};

export const updateManyTransferInfo = async ({
	db,
	transactionIds
}: {
	db: DBType;
	transactionIds?: string[];
}) => {
	const journals = await db
		.select({
			id: journalEntry.id,
			transfer: journalEntry.transfer,
			accountType: account.type,
			transactionId: journalEntry.transactionId
		})
		.from(journalEntry)
		.leftJoin(account, eq(account.id, journalEntry.accountId))
		.where(transactionIds ? inArray(journalEntry.transactionId, transactionIds) : undefined)
		.execute();

	const returnedTransactionIds = [...new Set(journals.map((journal) => journal.transactionId))];

	await Promise.all(
		returnedTransactionIds.map(async (currentTransactionId) => {
			const transJournals = journals.filter(
				(item) => item.transactionId === currentTransactionId && item.accountType !== null
			);

			await doTransferUpdate({ db, journals: transJournals, transactionId: currentTransactionId });
		})
	);
};
