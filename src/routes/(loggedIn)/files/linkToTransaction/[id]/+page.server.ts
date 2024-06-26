import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo, urlGenerator } from '$lib/routes';
import { fileFormActions } from '$lib/server/fileFormActions';
import { tActions } from '$lib/server/db/actions/tActions';
import { redirect } from '@sveltejs/kit';
import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates.js';

export const load = async (data) => {
	authGuard(data);
	const { current } = serverPageInfo(data.route.id, data);

	if (!current.params?.id) {
		redirect(302, urlGenerator({ address: '/(loggedIn)/files', searchParamsValue: {} }).url);
	}

	const journals = await tActions.journalView.list({
		db: data.locals.db,
		filter: { transactionIdArray: [current.params.id] }
	});

	const accounts = filterNullUndefinedAndDuplicates(journals.data.map((t) => t.accountId));
	const bills = filterNullUndefinedAndDuplicates(journals.data.map((t) => t.billId));
	const categories = filterNullUndefinedAndDuplicates(journals.data.map((t) => t.categoryId));
	const tags = filterNullUndefinedAndDuplicates(journals.data.map((t) => t.tagId));
	const budgets = filterNullUndefinedAndDuplicates(journals.data.map((t) => t.budgetId));
	const labels = filterNullUndefinedAndDuplicates(
		journals.data.map((item) => item.labels.map((label) => label.id)).flat()
	);

	const accountFiles =
		accounts.length > 0
			? (
					await tActions.file.listWithoutPagination({
						db: data.locals.db,
						filter: { accountIdArray: accounts }
					})
				).map((item) => item.id)
			: [];

	const billFiles =
		bills.length > 0
			? (
					await tActions.file.listWithoutPagination({
						db: data.locals.db,
						filter: { billIdArray: bills }
					})
				).map((item) => item.id)
			: [];

	const categoryFiles =
		categories.length > 0
			? (
					await tActions.file.listWithoutPagination({
						db: data.locals.db,
						filter: { categoryIdArray: categories }
					})
				).map((item) => item.id)
			: [];

	const tagFiles =
		tags.length > 0
			? (
					await tActions.file.listWithoutPagination({
						db: data.locals.db,
						filter: { tagIdArray: tags }
					})
				).map((item) => item.id)
			: [];

	const budgetFiles =
		budgets.length > 0
			? (
					await tActions.file.listWithoutPagination({
						db: data.locals.db,
						filter: { budgetIdArray: budgets }
					})
				).map((item) => item.id)
			: [];

	const labelFiles =
		labels.length > 0
			? (
					await tActions.file.listWithoutPagination({
						db: data.locals.db,
						filter: { labelIdArray: labels }
					})
				).map((item) => item.id)
			: [];

	const fileIds = filterNullUndefinedAndDuplicates([
		...accountFiles,
		...billFiles,
		...categoryFiles,
		...tagFiles,
		...budgetFiles,
		...labelFiles
	]);

	const likelyFiles =
		fileIds.length > 0
			? await tActions.file.listWithoutPagination({
					db: data.locals.db,
					filter: { idArray: fileIds, linked: true }
				})
			: [];

	const unlinkedFiles = await tActions.file.listWithoutPagination({
		db: data.locals.db,
		filter: { linked: false }
	});

	const currentlyLinkedItems = await tActions.file.listWithoutPagination({
		db: data.locals.db,
		filter: {
			transactionIdArray: [current.params.id]
		}
	});

	return {
		transactionId: current.params.id,
		likelyFiles,
		unlinkedFiles,
		currentlyLinkedItems
	};
};

export const actions = {
	...fileFormActions
};
