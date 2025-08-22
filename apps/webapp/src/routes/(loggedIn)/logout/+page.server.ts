import { redirect } from '@sveltejs/kit';

import { tActions } from '@totallator/business-logic';

import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { urlGenerator } from '$lib/routes';

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
		await tActions.auth.invalidateSession(sessionId);
		tActions.auth.deleteSessionTokenCookie(data);

		redirect(302, urlGenerator({ address: '/(loggedOut)/login' }).url);
	}
};
