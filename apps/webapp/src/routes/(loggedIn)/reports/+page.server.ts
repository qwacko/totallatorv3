import { authGuard } from '$lib/authGuard/authGuardConfig';

export const load = async (data) => {
	authGuard(data);

	data.locals.global.logger('reports').trace({
		code: 'WEB_RPT_001',
		title: 'Reports page loaded',
		userId: data.locals.user?.id
	});

	return {};
};
