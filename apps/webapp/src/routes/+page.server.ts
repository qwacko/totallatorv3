import { authGuard } from '$lib/authGuard/authGuardConfig';

export const load = (data) => {
	authGuard(data);

	data.locals.global.logger('webapp').trace({
		code: 'WEB_HOME_001',
		title: 'Home/dashboard page loaded',
		userId: data.locals.user?.id
	});
};
