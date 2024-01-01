import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { db } from '$lib/server/db/db';
import { user } from '$lib/server/db/postgres/schema';
import { serverPageInfo, urlGenerator } from '$lib/routes';
import { redirect } from '@sveltejs/kit';

export const load = async (data) => {
	authGuard(data);
	const { current } = serverPageInfo(data.route.id, data);
	// Fetch users from database
	const allUsers = await db.select().from(user).execute();

	const perPage = 5;
	const page = current.searchParams ? current.searchParams.page : 0;
	const numberOfUsers = allUsers.length;

	const numPages = Math.ceil(numberOfUsers / perPage);

	if (numPages === 0 && page !== 0) {
		redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/users', searchParamsValue: { page: 0 } }).url
		);
	}

	if (page >= numPages && numPages > 0) {
		redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/users', searchParamsValue: { page: numPages - 1 } }).url
		);
	}

	const users = current.searchParams
		? allUsers.slice(current.searchParams.page * perPage, (current.searchParams.page + 1) * perPage)
		: allUsers.slice(0, perPage);

	return { users, numberOfUsers, page, perPage, numPages };
};
