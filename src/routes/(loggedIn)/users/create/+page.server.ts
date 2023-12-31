import { signupSchema } from '$lib/schema/signupSchema';
import { superValidate } from 'sveltekit-superforms/server';
import type { Actions } from './$types';
import { createUserHandler } from '$lib/server/createUserHandler';
import { authGuard } from '$lib/authGuard/authGuardConfig';

export const load = async (data) => {
	authGuard(data);

	const form = await superValidate(signupSchema);

	return { form };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const admin = locals.user?.admin;

		//Admin Cannot Do This
		if (!admin) {
			return {};
		}

		return createUserHandler({ request, locals, admin: false, setSession: false });
	}
};
