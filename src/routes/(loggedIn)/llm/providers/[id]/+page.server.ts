import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { tActions } from '$lib/server/db/actions/tActions';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

const updateLLMProviderSchema = z.object({
	id: z.string(),
	title: z.string().min(1, 'Title is required'),
	apiUrl: z.string().url('Valid API URL is required'),
	apiKey: z.string().optional(), // Optional for updates - keep existing if not provided
	defaultModel: z.string().min(1, 'Default model is required'),
	enabled: z.boolean(),
	prevPage: z.string().optional(),
	currentPage: z.string().optional()
});

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;
	const pageInfo = serverPageInfo(data.route.id, data);

	if (!pageInfo.current.params?.id) redirect(302, '/llm/providers');

	const provider = await tActions.llm.getById({ db, id: pageInfo.current.params?.id });
	if (!provider) redirect(302, '/llm/providers');

	// Don't include the actual API key in the form for security
	const form = await superValidate(
		{
			id: provider.id,
			title: provider.title,
			apiUrl: provider.apiUrl,
			defaultModel: provider.defaultModel || '',
			enabled: provider.enabled,
			apiKey: '' // Empty for security
		},
		zod(updateLLMProviderSchema)
	);

	return {
		provider,
		form
	};
};

export const actions = {
	default: async ({ request, locals }) => {
		const db = locals.db;
		const form = await superValidate(request, zod(updateLLMProviderSchema));

		if (!form.valid) {
			return { form };
		}

		try {
			const { prevPage, currentPage, apiKey, ...updateData } = form.data;

			// Only include API key in update if it was provided
			const dataToUpdate = apiKey && apiKey.trim() !== '' ? { ...updateData, apiKey } : updateData;

			await tActions.llm.update({
				db,
				data: dataToUpdate,
				id: form.data.id
			});
		} catch (e) {
			logging.error('Update LLM Provider Error', e);
			return message(form, 'Error Updating LLM Provider');
		}
		redirect(302, form.data.prevPage || '/llm/providers');
	}
};
