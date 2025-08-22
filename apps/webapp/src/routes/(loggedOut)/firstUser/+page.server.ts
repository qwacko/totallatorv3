import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { dbNoAdmins } from '@totallator/business-logic';
import { signupSchema } from '@totallator/shared';

import { authGuard } from '$lib/authGuard/authGuardConfig';
import { createUserHandler } from '$lib/server/createUserHandler';

import type { Actions } from './$types';

export const load = async (data) => {
	authGuard(data);
	const form = await superValidate(zod4(signupSchema));
	return { form };
};

export const actions: Actions = {
	default: async (request) => {
		//Only allow creation of a first user as an admin if there is no existing admins.
		const noAdmin = await dbNoAdmins(request.locals.db);
		if (noAdmin) {
			return createUserHandler({
				request,
				locals: request.locals,
				admin: true,
				cookies: request.cookies
			});
		}
	}
};
