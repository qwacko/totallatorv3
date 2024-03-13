import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { urlGenerator } from '$lib/routes';
import { auth } from '$lib/server/lucia.js';
import { redirect } from '@sveltejs/kit';

export const load = (data) => {
	authGuard(data);

	return {};
};

export const actions = {
	default: async (data) => {
		const sessionId = data.locals.session?.id;

		if (!sessionId) {
			return;
		}
		await auth.invalidateSession(sessionId);

		const sessionCookie = auth.createBlankSessionCookie();
		data.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		redirect(302, urlGenerator({ address: '/(loggedOut)/login' }).url);
	}
};
