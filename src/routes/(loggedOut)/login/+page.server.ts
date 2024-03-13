import { auth } from '$lib/server/lucia';
import { fail, redirect } from '@sveltejs/kit';

import type { Actions } from './$types';
import { setMessage, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { loginSchema } from '$lib/schema/loginSchema';
import { serverEnv } from '$lib/server/serverEnv';
import { authGuard } from '$lib/authGuard/authGuardConfig';
import { userActions } from '$lib/server/db/actions/userActions';
import { logging } from '$lib/server/logging';

export const load = async (data) => {
	authGuard(data);
	const form = await superValidate(zod(loginSchema));

	return { form, enableSignup: serverEnv.ALLOW_SIGNUP };
};

export const actions: Actions = {
	default: async ({ request, locals, cookies }) => {
		const form = await superValidate(request, zod(loginSchema));

		if (!form.valid) {
			return fail(400, { form });
		}
		try {
			const user = await userActions.checkLogin({
				db: locals.db,
				username: form.data.username.toLowerCase(),
				password: form.data.password
			});

			if (!user) {
				throw new Error('User not found');
			}

			const session = await auth.createSession(user.id, {});
			const sessionCookie = auth.createSessionCookie(session.id);

			cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			});
		} catch (e) {
			logging.error('Error Logging In', e);
			return setMessage(form, 'Incorrect username or password', { status: 400 });
		}
		redirect(302, '/');
	}
};
