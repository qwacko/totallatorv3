import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { urlGenerator } from '$lib/routes.js';
import { reportPageValidation } from '$lib/schema/pageAndFilterValidation.js';
import { createReportSchema } from '$lib/schema/reportSchema.js';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/client';

export const load = async (data) => {
	authGuard(data);

	const form = await superValidate(createReportSchema);

	return { form };
};

export const actions = {
	default: async ({ request, locals }) => {
		const db = locals.db;
		const form = await superValidate(request, createReportSchema.merge(reportPageValidation));

		if (!form.valid) {
			return { form };
		}

		let newReportId = '';

		try {
			newReportId = await tActions.report.create({ db, data: form.data });
		} catch (e) {
			logging.error('Create Report Error', e);
			return message(form, 'Error Creating Report, Possibly Group / Title Already Exists');
		}
		redirect(
			302,
			urlGenerator({
				address: '/(loggedIn)/reports/[id]',
				paramsValue: { id: newReportId },
				searchParamsValue: {}
			}).url
		);
	}
};
