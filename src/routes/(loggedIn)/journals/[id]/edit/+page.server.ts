import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { urlGenerator } from '$lib/routes.js';
import { defaultJournalFilter, updateJournalSchema } from '$lib/schema/journalSchema.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db.js';
import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';

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

	const journalForm = await superValidate(
		{ ...journal, date: journal.date.toISOString().slice(0, 10) },
		updateJournalSchema
	);

	const otherJournalsRaw = await tActions.journal.list({
		db,
		filter: { transactionIdArray: [journalInformation.data[0].transactionId] }
	});

	const otherJournals = otherJournalsRaw.data.filter((item) => item.id !== journal.id);

	return { journal, otherJournals, journalForm };
};
