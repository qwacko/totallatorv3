import { authGuard } from '$lib/authGuard/authGuardConfig';
import { tActions } from '$lib/server/db/actions/tActions';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { getAllPredefinedProviders, isPredefinedProvider } from '$lib/llm/providerConfig';

const createLLMProviderSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	apiUrl: z
		.string()
		.min(1, 'Provider is required')
		.refine((value) => {
			// Must be a predefined provider ID
			return isPredefinedProvider(value);
		}, 'Must be a supported provider'),
	apiKey: z.string().min(1, 'API key is required'),
	defaultModel: z.string().min(1, 'Default model is required'),
	enabled: z.boolean().default(true),
	prevPage: z.string().optional(),
	currentPage: z.string().optional()
});

export const load = async (data) => {
	authGuard(data);

	const form = await superValidate(zod(createLLMProviderSchema));
	const predefinedProviders = getAllPredefinedProviders();

	return {
		form,
		predefinedProviders
	};
};

export const actions = {
	default: async ({ request, locals }) => {
		const db = locals.db;
		const form = await superValidate(request, zod(createLLMProviderSchema));

		if (!form.valid) {
			return { form };
		}

		try {
			const { prevPage, currentPage, ...providerData } = form.data;
			await tActions.llm.create({
				db,
				data: providerData
			});
		} catch (e) {
			logging.error('Create LLM Provider Error', e);
			return message(form, 'Error Creating LLM Provider, Possibly Already Exists');
		}
		redirect(302, form.data.prevPage || '/llm/providers');
	}
};
