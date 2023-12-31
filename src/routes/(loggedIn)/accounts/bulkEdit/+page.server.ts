import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo, urlGenerator } from '$lib/routes';
import { tActions } from '$lib/server/db/actions/tActions';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/db';
import { superValidate } from 'sveltekit-superforms/server';
import { accountFilterSchema, updateAccountSchema } from '$lib/schema/accountSchema';
import { accountFilterToText } from '$lib/server/db/actions/helpers/account/accountFilterToQuery';
import { accountPageAndFilterValidation } from '$lib/schema/pageAndFilterValidation';
import { logging } from '$lib/server/logging';

export const load = async (data) => {
	authGuard(data);
	const pageInfo = serverPageInfo(data.route.id, data);

	const filter = pageInfo.current.searchParams;

	if (!filter) redirect(302, '/accounts');

	const commonData = await tActions.account.listCommonProperties({
		db,
		filter
	});
	const accounts = await tActions.account.list({ db, filter });

	if (!commonData) redirect(302, '/accounts');

	const form = await superValidate(commonData, updateAccountSchema);
	const filterText = await accountFilterToText({ filter, db });

	const titles = accounts.data.map((item) => item.title);

	const numberItems = accounts.count;

	return {
		idArray: filter,
		form,
		titles,
		filterText,
		numberItems
	};
};

const submitValidation = updateAccountSchema.merge(accountPageAndFilterValidation);

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, submitValidation);
		if (!form.valid) {
			redirect(302, form.data.currentPage);
		}

		const parsedFilter = accountFilterSchema.safeParse(JSON.parse(form.data.filter));

		if (!parsedFilter.success) {
			redirect(302, form.data.currentPage);
		}

		try {
			const { currentPage, prevPage, filter, ...restData } = form.data;
			await tActions.account.updateMany({ db, filter: parsedFilter.data, data: restData });
		} catch (e) {
			logging.error('Error Updating Journal State : ', e);
			redirect(
				302,
				form.data.prevPage ||
				urlGenerator({
					address: '/(loggedIn)/accounts',
					searchParamsValue: {}
				}).url
			);
		}

		redirect(302, form.data.prevPage);
	}
};
