import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo, urlGenerator } from '$lib/routes';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/db';

export const load = async (data) => {
	authGuard(data);
	const { current } = serverPageInfo(data.route.id, data);

	if (!current.params) {
		redirect(
        			302,
        			urlGenerator({ address: '/(loggedIn)/filters', searchParamsValue: {} }).url
        		);
	}

	const filterInfo = await tActions.reusableFitler.getById({ db, id: current.params.id });

	if (!filterInfo) {
		redirect(
        			302,
        			urlGenerator({ address: '/(loggedIn)/filters', searchParamsValue: {} }).url
        		);
	}

	return {
		filter: filterInfo
	};
};

export const actions = {
	default: async ({ params, request }) => {
		const id = params.id;
		const form = await request.formData();
		const prevPage = form.get('prevPage');

		await tActions.reusableFitler.delete({ db, id });

		redirect(
        			302,
        			prevPage
        				? prevPage.toString()
        				: urlGenerator({ address: '/(loggedIn)/filters', searchParamsValue: {} }).url
        		);
	}
};
