import { authGuard } from '$lib/authGuard/authGuardConfig';
import { urlGenerator } from '$lib/routes.js';
import { auth } from '$lib/server/lucia.js';
import { redirect } from '@sveltejs/kit';

export const load = (requestData) => {
	authGuard(requestData);
};

export const actions = {
	default: async ({ params, locals }) => {
		const authUser = locals.user;
		if (!authUser) {
			return;
		}
		if (!authUser.admin || authUser.userId === params.id) {
			return;
		}

		await auth.deleteUser(params.id);

		redirect(
        			302,
        			urlGenerator({ address: '/(loggedIn)/users', searchParamsValue: { page: 0 } }).url
        		);
	}
};
