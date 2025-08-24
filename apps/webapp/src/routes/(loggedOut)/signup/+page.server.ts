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

	data.locals.global.logger('auth').trace({
		code: 'WEB_AUTH_010',
		title: 'Signup page loaded',
		userAgent: data.request.headers.get('user-agent'),
		ip: data.getClientAddress(),
		signupEnabled: serverEnv.ALLOW_SIGNUP
	});

	const form = await superValidate(zod4(signupSchema));
	if (!serverEnv.ALLOW_SIGNUP) {
		data.locals.global.logger('auth').warn({
			code: 'WEB_AUTH_011',
			title: 'Signup attempted but disabled - redirecting to login',
			userAgent: data.request.headers.get('user-agent'),
			ip: data.getClientAddress()
		});
		redirect(302, '/login');
	}

	return { form };
};

export const actions: Actions = {
	default: async (request) => {
		request.locals.global.logger('auth').info({
			code: 'WEB_AUTH_012',
			title: 'User signup attempt started',
			userAgent: request.request.headers.get('user-agent'),
			ip: request.getClientAddress()
		});

		try {
			const result = await createUserHandler({
				request,
				locals: request.locals,
				admin: false,
				setSession: true,
				cookies: request.cookies
			});

			if (result && result.status !== 400) {
				request.locals.global.logger('auth').info({
					code: 'WEB_AUTH_013',
					title: 'User signup successful',
					userAgent: request.request.headers.get('user-agent'),
					ip: request.getClientAddress()
				});
			}

			return result;
		} catch (e) {
			request.locals.global.logger('auth').error({
				code: 'WEB_AUTH_014',
				title: 'User signup failed',
				userAgent: request.request.headers.get('user-agent'),
				ip: request.getClientAddress(),
				error: e
			});
			throw e;
		}
	}
};
