import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo, urlGenerator } from '$lib/routes.js';
import { defaultJournalFilter, updateJournalSchema } from '$lib/schema/journalSchema.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db.js';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';

export const load = async (data) => {
	authGuard(data);
	const pageInfo = serverPageInfo(data.route.id, data);

	const journalInformation = await tActions.journal.list({
		db: db,
		filter: { id: pageInfo.current?.params?.id }
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
		filter: {
			transactionIdArray: [journalInformation.data[0].transactionId],
			account: { type: ['asset', 'expense', 'income', 'liability'] }
		}
	});

	const otherJournals = otherJournalsRaw.data.filter((item) => item.id !== journal.id);

	const otherAccountId = otherJournals.length === 1 ? otherJournals[0].accountId : undefined;

	const journalForm = await superValidate(
		{
			...journal,
			date: journal.date.toISOString().slice(0, 10),
			accountTitle: undefined,
			otherAccountTitle: undefined,
			tagTitle: undefined,
			categoryTitle: undefined,
			billTitle: undefined,
			budgetTitle: undefined,
			otherAccountId
		},
		updateJournalSchema
	);

	return { journal, otherJournals, journalForm };
};

export const actions = {
	update: async ({ request, params }) => {
		const form = await superValidate(request, updateJournalSchema);

		if (!form.valid) {
			return { form };
		}

		try {
			await tActions.journal.updateJournals({
				db,
				filter: { id: params.id },
				journalData: form.data
			});
		} catch (e) {
			logging.error('Journal Update Error : ', e);
			return message(form, 'Error Updating Tag');
		}

		throw redirect(302, form.data.previousURL || '/journals');
	}
};
