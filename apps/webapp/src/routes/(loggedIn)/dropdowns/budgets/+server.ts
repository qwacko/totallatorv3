import { text } from '@sveltejs/kit';
import superjson from 'superjson';

import { tActions } from '@totallator/business-logic';

import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes.server';

export const GET = async (data) => {
	authGuard(data);
	serverPageInfo(data.route.id, data);

	const dropdownData = await tActions.budget.listForDropdown();

	return text(superjson.stringify(dropdownData));
};
