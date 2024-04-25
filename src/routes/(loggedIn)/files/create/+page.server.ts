import { authGuard } from '$lib/authGuard/authGuardConfig';
import { createFileSchema } from '$lib/schema/fileSchema.js';
import { fileFormActions } from '$lib/server/fileFormActions';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async (data) => {
	authGuard(data);

	return {
		form: await superValidate(zod(createFileSchema))
	};
};

export const actions = fileFormActions;
