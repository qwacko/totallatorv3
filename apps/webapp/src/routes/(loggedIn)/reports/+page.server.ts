import { authGuard } from '$lib/authGuard/authGuardConfig';

export const load = async (data) => {
	authGuard(data);

	return {};
};
