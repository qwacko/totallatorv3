import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { tActions } from '@totallator/business-logic';
import { reportConfigPartFormSchema } from '@totallator/shared';

import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { defaultReportRedirect } from '$lib/helpers/defaultRedirect.js';
import { serverPageInfo, urlGeneratorServer } from '$lib/routes.server';

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
			urlGeneratorServer({
				address: '/(loggedIn)/reports/element/[id]',
				paramsValue: {
					id: pageInfo.current.params.id
				}
			}).url
		);
	}

	const itemForm = await superValidate(itemData, zod4(reportConfigPartFormSchema));

	return { itemData, itemForm };
};

export const actions = {
	update: async (data) => {
		const id = data.params.id;
		const item = data.params.item;

		const form = await superValidate(data.request, zod4(reportConfigPartFormSchema));

		if (!form.valid) {
			return form;
		}

		try {
			const reportElement = await tActions.report.reportElement.get({ id });

			if (!reportElement) {
				throw new Error(`Report Element Not Found. ID = ${id}`);
			}

			await tActions.report.reportElementConfigItem.update({
				itemId: item,
				configId: reportElement.reportElementConfigId,
				data: form.data
			});
		} catch (e) {
			data.locals.global.logger('reports').error({
				code: 'RPT_0014',
				title: 'Error Updating Report Element Item',
				error: e
			});
			return message(form, 'Error Updating Report Element Item', {
				status: 400
			});
		}
	}
};
