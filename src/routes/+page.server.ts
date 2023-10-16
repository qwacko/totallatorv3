import { authGuard } from '$lib/authGuard/authGuardConfig';

export const load = (data) => {
	authGuard(data);
};
