import type { Actions } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { signupSchema } from '$lib/schema/signupSchema';
import { zod } from 'sveltekit-superforms/adapters';
import { createUserHandler } from '$lib/server/createUserHandler';
import { serverEnv } from '$lib/server/serverEnv';
import { redirect } from '@sveltejs/kit';
import { authGuard } from '$lib/authGuard/authGuardConfig';

export const load = async (data) => {
	authGuard(data);
	const form = await superValidate(zod(signupSchema));
	if (!serverEnv.ALLOW_SIGNUP) {
		redirect(302, '/login');
	}

	return { form };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		return createUserHandler({ request, locals, admin: false, setSession: true });
	}
};
