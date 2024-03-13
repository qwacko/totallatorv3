import { auth } from '$lib/server/lucia';
import { fail, redirect, type Cookies } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { signupSchema } from '$lib/schema/signupSchema';
import { logging } from '$lib/server/logging';
import { userActions } from './db/actions/userActions';

export const createUserHandler = async ({
	request,
	locals,
	admin,
	setSession = false,
	cookies
}: {
	request: Request;
	locals: App.Locals;
	admin: boolean;
	setSession?: boolean;
	cookies: Cookies;
}) => {
	const form = await superValidate(request, zod(signupSchema));

	if (!form.valid) {
		return fail(400, { form });
	}

	try {
		const user = await userActions.createUser({
			db: locals.db,
			username: form.data.username.toLowerCase(),
			password: form.data.password,
			admin
		});

		if (!user) {
			throw new Error('User not created');
		}

		if (setSession) {
			const session = await auth.createSession(user.id, {});
			const sessionCookie = auth.createSessionCookie(session.id);

			cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			});
		}
	} catch (e) {
		logging.error('Error creating user', e);
		return setError(form, 'username', 'Error creating user. Username possibly already exists.');
	}
	// redirect to
	// make sure you don't throw inside a try/catch block!
	redirect(302, '/user');
};
