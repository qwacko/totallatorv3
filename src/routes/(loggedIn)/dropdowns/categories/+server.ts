import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { tActions } from '$lib/server/db/actions/tActions';
import { text } from '@sveltejs/kit';
import superjson from 'superjson';

export const GET = async (data) => {
	authGuard(data);
	serverPageInfo(data.route.id, data);

	const dropdownData = await tActions.category.listForDropdown({ db: data.locals.db });

	return text(superjson.stringify(dropdownData));
};
