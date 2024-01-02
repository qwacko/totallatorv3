import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { createLabelSchema } from '$lib/schema/labelSchema.js';
import { labelPageAndFilterValidation } from '$lib/schema/pageAndFilterValidation.js';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { db } from '$lib/server/db/db.js';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/client';

export const load = async (data) => {
	authGuard(data);

	const form = await superValidate(createLabelSchema);

	return { form };
};

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(
			request,
			createLabelSchema.merge(labelPageAndFilterValidation)
		);

		if (!form.valid) {
			return { form };
		}

		try {
			await tActions.label.create(db, form.data);
		} catch (e) {
			logging.error('Create Label Error', e);
			return message(form, 'Error Creating Label, Possibly Already Exists');
		}
		redirect(302, form.data.prevPage);
	}
};
