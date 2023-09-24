import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { urlGenerator } from '$lib/routes.js';
import { defaultJournalFilter } from '$lib/schema/journalSchema.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db.js';
import { redirect } from '@sveltejs/kit';

export const load = async (data) => {
	authGuard(data);

	const journalInformation = await tActions.journal.list({
		db: db,
		filter: { id: data.params.id }
	});

	const journal = journalInformation.data[0];
	if (!journal) {
		throw redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/journals', searchParamsValue: defaultJournalFilter }).url
		);
	}

	const otherJournalsRaw = await tActions.journal.list({
		db,
		filter: { transactionIdArray: [journalInformation.data[0].transactionId] }
	});

	const otherJournals = otherJournalsRaw.data.filter((item) => item.id !== journal.id);

	return { journal, otherJournals };
};
