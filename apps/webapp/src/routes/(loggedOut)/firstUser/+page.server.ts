import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { dbNoAdmins } from '@totallator/business-logic';
import { signupSchema } from '@totallator/shared';

import { authGuard } from '$lib/authGuard/authGuardConfig';
import { createUserHandler } from '$lib/server/createUserHandler';

import type { Actions } from './$types';

export const load = async (data) => {
	authGuard(data);

	data.locals.global.logger('auth').info({
		code: 'WEB_AUTH_020',
		title: 'First user setup page loaded',
		userAgent: data.request.headers.get('user-agent'),
		ip: data.getClientAddress()
	});

	const form = await superValidate(zod4(signupSchema));
	return { form };
};

export const actions: Actions = {
	default: async (request) => {
		const startTime = Date.now();

		request.locals.global.logger('auth').info({
			code: 'WEB_AUTH_021',
			title: 'First user creation attempt started',
			userAgent: request.request.headers.get('user-agent'),
			ip: request.getClientAddress()
		});

		try {
			//Only allow creation of a first user as an admin if there is no existing admins.
			const noAdmin = await dbNoAdmins(request.locals.db);
			if (noAdmin) {
				const result = await createUserHandler({
					request,
					locals: request.locals,
					admin: true,
					cookies: request.cookies
				});

				const duration = Date.now() - startTime;
				if (result && result.status !== 400) {
					request.locals.global.logger('auth').info({
						code: 'WEB_AUTH_022',
						title: 'First admin user created successfully',
						duration,
						userAgent: request.request.headers.get('user-agent'),
						ip: request.getClientAddress()
					});
				}

				return result;
			} else {
				request.locals.global.logger('auth').warn({
					code: 'WEB_AUTH_023',
					title: 'First user creation attempted but admin already exists',
					userAgent: request.request.headers.get('user-agent'),
					ip: request.getClientAddress()
				});
				return;
			}
		} catch (e) {
			const duration = Date.now() - startTime;
			request.locals.global.logger('auth').error({
				code: 'WEB_AUTH_024',
				title: 'First user creation failed',
				duration,
				userAgent: request.request.headers.get('user-agent'),
				ip: request.getClientAddress(),
				error: e
			});
			throw e;
		}
	}
};
