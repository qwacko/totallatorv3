import { account, journalEntry, transaction } from '../../../postgres/schema';
import { SQL, and, eq, inArray, ilike, not } from 'drizzle-orm';
import { type DBType } from '../../../db';
import { alias } from 'drizzle-orm/pg-core';

export function journalPayeeToSubquery({
	db,
	payee
}: {
	db: DBType;
	payee: { id?: string; idArray?: string[]; title?: string };
}) {
	const otherJournal = alias(journalEntry, 'otherJournal');

	const payeeFilter: SQL<unknown>[] = [];

	if (payee.id) {
		payeeFilter.push(eq(otherJournal.accountId, payee.id));
	}
	if (payee.title) {
		payeeFilter.push(ilike(account.title, `%${payee.title}%`));
	}

	if (payee.idArray && payee.idArray.length > 0) {
		payeeFilter.push(inArray(otherJournal.accountId, payee.idArray));
	}

	const payeeJournalSQ = db
		.select({ id: journalEntry.id })
		.from(journalEntry)
		.leftJoin(transaction, eq(journalEntry.transactionId, transaction.id))
		.leftJoin(
			otherJournal,
			and(eq(otherJournal.transactionId, transaction.id), not(eq(otherJournal.id, journalEntry.id)))
		)
		.leftJoin(account, eq(otherJournal.accountId, account.id))
		.where(and(...payeeFilter))
		.groupBy(journalEntry.id)
		.as('payee_journal_sq');

	return payeeJournalSQ;
}
