import { fail, redirect } from '@sveltejs/kit';
import { setMessage, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { tActions, userActions } from '@totallator/business-logic';
import { loginSchema } from '@totallator/shared';

import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverEnv } from '$lib/server/serverEnv';

import type { Actions } from './$types';

export const load = async (data) => {
	authGuard(data);

	data.locals.global.logger('auth').trace({
		code: 'WEB_AUTH_001',
		title: 'Login page loaded',
		userAgent: data.request.headers.get('user-agent'),
		ip: data.getClientAddress()
	});

	const form = await superValidate(zod4(loginSchema));

	return { form, enableSignup: serverEnv.ALLOW_SIGNUP };
};

export const actions: Actions = {
	default: async (request) => {
		const startTime = Date.now();
		const form = await superValidate(request, zod4(loginSchema));

		if (!form.valid) {
			request.locals.global.logger('auth').warn({
				code: 'WEB_AUTH_002',
				title: 'Login form validation failed',
				username: form.data?.username,
				validationErrors: form.errors
			});
			return fail(400, { form });
		}

		request.locals.global.logger('auth').info({
			code: 'WEB_AUTH_003',
			title: 'Login attempt started',
			username: form.data.username.toLowerCase(),
			userAgent: request.request.headers.get('user-agent'),
			ip: request.getClientAddress()
		});

		try {
			const user = await userActions.checkLogin({
				username: form.data.username.toLowerCase(),
				password: form.data.password
			});

			if (!user) {
				throw new Error('User not found');
			}

			const token = tActions.auth.generateSessionToken();
			const session = await tActions.auth.createSession(token, user.id);
			tActions.auth.setSessionTokenCookie(request, token, session.expiresAt);

			const duration = Date.now() - startTime;
			request.locals.global.logger('auth').info({
				code: 'WEB_AUTH_004',
				title: 'User login successful',
				userId: user.id,
				username: form.data.username.toLowerCase(),
				sessionId: session.id,
				duration,
				userAgent: request.request.headers.get('user-agent'),
				ip: request.getClientAddress()
			});
		} catch (e) {
			const duration = Date.now() - startTime;
			request.locals.global.logger('auth').warn({
				code: 'WEB_AUTH_005',
				title: 'Login attempt failed',
				username: form.data.username.toLowerCase(),
				duration,
				userAgent: request.request.headers.get('user-agent'),
				ip: request.getClientAddress(),
				error: e
			});
			return setMessage(form, 'Incorrect username or password', {
				status: 400
			});
		}
		redirect(302, '/');
	}
};
