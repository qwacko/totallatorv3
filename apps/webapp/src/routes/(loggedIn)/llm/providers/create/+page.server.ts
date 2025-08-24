import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import * as z from 'zod';

import { tActions } from '@totallator/business-logic';
import { actionHelpers } from '@totallator/business-logic';

import { authGuard } from '$lib/authGuard/authGuardConfig';

const createLLMProviderSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	apiUrl: z
		.string()
		.min(1, 'Provider is required')
		.refine((value) => {
			// Must be a predefined provider ID
			return actionHelpers.isPredefinedProvider(value);
		}, 'Must be a supported provider'),
	apiKey: z.string().min(1, 'API key is required'),
	defaultModel: z.string().min(1, 'Default model is required'),
	enabled: z.boolean().default(true),
	prevPage: z.string().optional(),
	currentPage: z.string().optional()
});

export const load = async (data) => {
	authGuard(data);

	const form = await superValidate(zod4(createLLMProviderSchema));
	const predefinedProviders = actionHelpers.getAllPredefinedProviders();

	return {
		form,
		predefinedProviders
	};
};

export const actions = {
	default: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(createLLMProviderSchema));

		if (!form.valid) {
			return { form };
		}

		try {
			const { prevPage, currentPage, ...providerData } = form.data;
			await tActions.llm.create({
				data: providerData
			});
		} catch (e) {
			locals.global.logger('llm').error({
				code: 'LLM_0001',
				title: 'Create LLM Provider Error',
				error: e
			});
			return message(form, 'Error Creating LLM Provider, Possibly Already Exists');
		}
		redirect(302, form.data.prevPage || '/llm/providers');
	}
};
