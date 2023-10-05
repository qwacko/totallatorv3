import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo, urlGenerator } from '$lib/routes.js';
import { defaultJournalFilter, updateJournalSchema } from '$lib/schema/journalSchema.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db.js';
// import { logging } from '$lib/server/logging';
// import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';

const getCommonData = <
	T extends string,
	U extends Record<T, string | number | undefined | null | date>
>(
	key: T,
	data: U[]
) => {
	const targetSet = [...new Set(data.map((item) => item[key]))];

	if (targetSet.length === 0) {
		return targetSet[0];
	}
	return undefined;
};

export const load = async (data) => {
	authGuard(data);
	const pageInfo = serverPageInfo(data.route.id, data);

	const journalInformation = await tActions.journal.list({
		db: db,
		filter: pageInfo.current.searchParams || defaultJournalFilter
	});

	const accountId = getCommonData('accountId', journalInformation.data);
	const amount = getCommonData('amount', journalInformation.data);
	const tagId = getCommonData('tagId', journalInformation.data);
	const categoryId = getCommonData('categoryId', journalInformation.data);
	const billId = getCommonData('billId', journalInformation.data);
	const budgetId = getCommonData('budgetId', journalInformation.data);
	const date = getCommonData('dateText', journalInformation.data);
	const description = getCommonData('description', journalInformation.data);
	const linked = getCommonData('linked', journalInformation.data);
	const reconciled = getCommonData('reconciled', journalInformation.data);
	const complete = getCommonData('complete', journalInformation.data);
	const dataChecked = getCommonData('dataChecked', journalInformation.data);

	const form = await superValidate(
		{
			accountId,
			amount,
			tagId,
			categoryId,
			billId,
			budgetId,
			date,
			description,
			linked,
			reconciled,
			complete,
			dataChecked
		},
		updateJournalSchema
	);

	return { journalInformation, form };

	// const journal = journalInformation.data[0];
	// if (!journal) {
	// 	throw redirect(
	// 		302,
	// 		urlGenerator({ address: '/(loggedIn)/journals', searchParamsValue: defaultJournalFilter }).url
	// 	);
	// }
	// const otherJournalsRaw = await tActions.journal.list({
	// 	db,
	// 	filter: {
	// 		transactionIdArray: [journalInformation.data[0].transactionId],
	// 		account: { type: ['asset', 'expense', 'income', 'liability'] }
	// 	}
	// });

	// const otherJournals = otherJournalsRaw.data.filter((item) => item.id !== journal.id);

	// const otherAccountId = otherJournals.length === 1 ? otherJournals[0].accountId : undefined;

	// const journalForm = await superValidate(
	// 	{
	// 		...journal,
	// 		date: journal.date.toISOString().slice(0, 10),
	// 		accountTitle: undefined,
	// 		otherAccountTitle: undefined,
	// 		tagTitle: undefined,
	// 		categoryTitle: undefined,
	// 		billTitle: undefined,
	// 		budgetTitle: undefined,
	// 		otherAccountId
	// 	},
	// 	updateJournalSchema
	// );

	// return { journal, otherJournals, journalForm };
};
