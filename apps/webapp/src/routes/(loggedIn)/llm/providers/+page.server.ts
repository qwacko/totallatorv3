import { error, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import * as z from 'zod';

import { tActions } from '@totallator/business-logic';
import { actionHelpers } from '@totallator/business-logic';

import { authGuard } from '$lib/authGuard/authGuardConfig';
import { associatedInfoFormActions } from '$lib/server/associatednfoFormActions';
import { fileFormActions } from '$lib/server/fileFormActions';
import { noteFormActions } from '$lib/server/noteFormActions';

const submitValidation = z.object({
	id: z.string(),
	status: z.enum(['active', 'disabled'])
});

export const load = async (data) => {
	authGuard(data);

	// Load all LLM providers
	const providers = await tActions.llm.list();

	return {
		providers
	};
};

export const actions = {
	...noteFormActions,
	...fileFormActions,
	...associatedInfoFormActions,

	update: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(submitValidation));

		if (!form.valid) {
			return error(400, 'Invalid form data');
		}

		try {
			await tActions.llm.update({
				data: { enabled: form.data.status === 'active' },
				id: form.data.id
			});
			return {
				status: 200,
				body: {
					message: 'LLM Provider Updated'
				}
			};
		} catch (e) {
			locals.global.logger('llm').error({
				code: 'LLM_0003',
				title: 'LLM Provider Update Error',
				error: e
			});
			return error(500, 'Error updating LLM provider');
		}
	},

	processJournals: async ({ locals }) => {
		const db = locals.db;

		try {
			locals.global.logger('llm').info({
				code: 'LLM_0004',
				title: 'Manual LLM batch processing triggered'
			});

			const stats = await actionHelpers.processAllAccounts(db);

			locals.global.logger('llm').info({
				code: 'LLM_0005',
				title: 'Manual LLM batch processing completed',
				stats
			});
		} catch (e) {
			locals.global.logger('llm').error({
				code: 'LLM_0006',
				title: 'LLM Batch Processing Error',
				error: e
			});
			return error(500, 'Error processing journals with LLM');
		}

		// Redirect back with success message after successful processing
		throw redirect(302, '/llm/providers?processed=true');
	}
};
