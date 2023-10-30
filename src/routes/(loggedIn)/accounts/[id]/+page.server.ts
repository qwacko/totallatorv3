import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { updateAccountSchema, updateAccountSchemaWithId } from '$lib/schema/accountSchema';
import { accountPageAndFilterValidation } from '$lib/schema/pageAndFilterValidation.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';

export const load = async (data) => {
	authGuard(data);
	const pageInfo = serverPageInfo(data.route.id, data);

	if (!pageInfo.current.params?.id) throw redirect(302, '/accounts');

	const account = await tActions.account.getById(db, pageInfo.current.params?.id);
	if (!account) throw redirect(302, '/accounts');
	const form = await superValidate(
		{
			title: account.title,
			status: account.status,
			accountGroupCombined: account.accountGroupCombined,
			isCash: account.isCash,
			isNetWorth: account.isNetWorth,
			startDate: account.startDate,
			endDate: account.endDate,
			type: account.type
		},
		updateAccountSchema
	);

	return {
		account,
		form
	};
};

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(
			request,
			updateAccountSchemaWithId.merge(accountPageAndFilterValidation)
		);

		if (!form.valid) {
			return { form };
		}

		try {
			const { id, ...restData } = form.data;
			await tActions.account.update({ db, id, data: restData });
		} catch (e) {
			logging.info('Update Account Error', e);
			return message(form, 'Error Updating Account');
		}
		throw redirect(302, form.data.prevPage);
	}
};
