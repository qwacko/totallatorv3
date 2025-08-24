import { and, eq, ilike, not, SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { account, journalEntry, transaction } from '@totallator/database';
import { type DBType } from '@totallator/database';

import { ilikeArrayWrapped, inArrayWrapped } from '../misc/inArrayWrapped';

export function journalPayeeToSubquery({
	db,
	payee
}: {
	db: DBType;
	payee: {
		id?: string;
		idArray?: string[];
		title?: string;
		titleArray?: string[];
	};
}) {
	const otherJournal = alias(journalEntry, 'otherJournal');

	const payeeFilter: SQL<unknown>[] = [];

	if (payee.id) {
		payeeFilter.push(eq(otherJournal.accountId, payee.id));
	}
	if (payee.title) {
		payeeFilter.push(ilike(account.title, `%${payee.title}%`));
	}
	if (payee.titleArray && payee.titleArray.length > 0) {
		payeeFilter.push(ilikeArrayWrapped(account.title, payee.titleArray));
	}

	if (payee.idArray && payee.idArray.length > 0) {
		payeeFilter.push(inArrayWrapped(otherJournal.accountId, payee.idArray));
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
		.groupBy(journalEntry.id);

	return payeeJournalSQ;
}
