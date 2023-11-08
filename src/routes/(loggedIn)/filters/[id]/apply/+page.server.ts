import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo, urlGenerator } from '$lib/routes';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { db } from '$lib/server/db/db.js';
import { redirect } from '@sveltejs/kit';

export const load = async (data) => {
	authGuard(data);
	const { current } = serverPageInfo(data.route.id, data);

	if (!current.params?.id) {
		throw redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/filters', searchParamsValue: {} }).url
		);
	}

	const item = await tActions.reusableFitler.getById({ db, id: current.params.id });

	if (!item || !item.canApply) {
		throw redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/filters', searchParamsValue: {} }).url
		);
	}

	return {
		filter: item
	};
};

export const actions = {
	default: async ({ params, request }) => {
		const id = params.id;
		const form = await request.formData();
		const prevPage = form.get('prevPage');

		await tActions.reusableFitler.applyById({ db, id });

		throw redirect(
			302,
			prevPage
				? prevPage.toString()
				: urlGenerator({ address: '/(loggedIn)/filters', searchParamsValue: {} }).url
		);
	}
};
