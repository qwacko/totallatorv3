import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { urlGenerator } from '$lib/routes';
import { auth } from '$lib/server/auth';
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
		await auth.invalidateSession(data.locals.db, sessionId);
		auth.deleteSessionTokenCookie(data);

		redirect(302, urlGenerator({ address: '/(loggedOut)/login' }).url);
	}
};
