import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { signupSchema } from '@totallator/shared';

import { authGuard } from '$lib/authGuard/authGuardConfig';
import { createUserHandler } from '$lib/server/createUserHandler';
import { serverEnv } from '$lib/server/serverEnv';

import type { Actions } from './$types';

export const load = async (data) => {
	authGuard(data);
	const form = await superValidate(zod4(signupSchema));
	if (!serverEnv.ALLOW_SIGNUP) {
		redirect(302, '/login');
	}

	return { form };
};

export const actions: Actions = {
	default: async (request) => {
		return createUserHandler({
			request,
			locals: request.locals,
			admin: false,
			setSession: true,
			cookies: request.cookies
		});
	}
};
