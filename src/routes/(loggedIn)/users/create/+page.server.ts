import { signupSchema } from '$lib/schema/signupSchema';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions } from './$types';
import { createUserHandler } from '$lib/server/createUserHandler';
import { authGuard } from '$lib/authGuard/authGuardConfig';

export const load = async (data) => {
	authGuard(data);

	const form = await superValidate(zod(signupSchema));

	return { form };
};

export const actions: Actions = {
	default: async (request) => {
		const admin = request.locals.user?.admin;

		//Admin Cannot Do This
		if (!admin) {
			return {};
		}

		return createUserHandler({
			request,
			locals: request.locals,
			admin: false,
			setSession: false,
			cookies: request.cookies
		});
	}
};
