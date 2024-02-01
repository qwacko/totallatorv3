import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { defaultReportRedirect } from '$lib/helpers/defaultRedirect.js';
import { serverPageInfo, urlGenerator } from '$lib/routes';
import { reportConfigPartFormSchema } from '$lib/schema/reportHelpers/reportConfigPartSchema';
import { tActions } from '$lib/server/db/actions/tActions';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';

export const load = async (data) => {
	authGuard(data);
	const pageInfo = serverPageInfo(data.route.id, data);
	if (!pageInfo.current.params) {
		return defaultReportRedirect();
	}

	const parentData = await data.parent();

	const itemData = parentData.elementConfigWithData.itemData.find((item) =>
		item && pageInfo.current.params ? item.id === pageInfo.current.params.item : undefined
	);

	if (!itemData) {
		redirect(
			302,
			urlGenerator({
				address: '/(loggedIn)/reports/element/[id]',
				paramsValue: {
					id: pageInfo.current.params.id
				}
			}).url
		);
	}

	const itemForm = await superValidate(itemData, reportConfigPartFormSchema);

	return { itemData, itemForm };
};

export const actions = {
	update: async (data) => {
		const db = data.locals.db;
		const id = data.params.id;
		const item = data.params.item;

		const form = await superValidate(data.request, reportConfigPartFormSchema);

		if (!form.valid) {
			return form;
		}

		try {
			const reportElement = await tActions.report.reportElement.get({ db, id });

			if (!reportElement) {
				throw new Error(`Report Element Not Found. ID = ${id}`);
			}

			await tActions.report.reportElementConfigItem.update({
				db,
				itemId: item,
				configId: reportElement.reportElementConfigId,
				data: form.data
			});
		} catch (e) {
			logging.error('Error Updating Report Element Item : ', e);
			return message(form, 'Error Updating Report Element Item', { status: 400 });
		}
	}
};
