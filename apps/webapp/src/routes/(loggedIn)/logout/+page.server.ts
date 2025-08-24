import { redirect } from '@sveltejs/kit';

import { tActions } from '@totallator/business-logic';

import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { urlGenerator } from '$lib/routes';

export const load = (data) => {
	authGuard(data);

	data.locals.global.logger('auth').trace({
		code: 'WEB_AUTH_030',
		title: 'Logout page loaded',
		userId: data.locals.user?.id,
		sessionId: data.locals.session?.id
	});

	return {};
};

export const actions = {
	default: async (data) => {
		const sessionId = data.locals.session?.id;
		const userId = data.locals.user?.id;

		data.locals.global.logger('auth').info({
			code: 'WEB_AUTH_031',
			title: 'User logout initiated',
			userId,
			sessionId,
			userAgent: data.request.headers.get('user-agent'),
			ip: data.getClientAddress()
		});

		if (!sessionId) {
			data.locals.global.logger('auth').warn({
				code: 'WEB_AUTH_032',
				title: 'Logout attempted without session',
				userId,
				userAgent: data.request.headers.get('user-agent'),
				ip: data.getClientAddress()
			});
			return;
		}

		try {
			await tActions.auth.invalidateSession(sessionId);
			tActions.auth.deleteSessionTokenCookie(data);

			data.locals.global.logger('auth').info({
				code: 'WEB_AUTH_033',
				title: 'User logout successful',
				userId,
				sessionId,
				userAgent: data.request.headers.get('user-agent'),
				ip: data.getClientAddress()
			});
		} catch (e) {
			data.locals.global.logger('auth').error({
				code: 'WEB_AUTH_034',
				title: 'Logout failed',
				userId,
				sessionId,
				userAgent: data.request.headers.get('user-agent'),
				ip: data.getClientAddress(),
				error: e
			});
		}

		redirect(302, urlGenerator({ address: '/(loggedOut)/login' }).url);
	}
};
