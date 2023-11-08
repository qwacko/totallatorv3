import { urlGenerator } from '$lib/routes';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';

export const load = async (data) => {
	const parentData = await data.parent();

	const canDelete = parentData.canDelete;

	if (!canDelete) {
		redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/import/[id]', paramsValue: { id: data.params.id } }).url
		);
	}
};

export const actions = {
	default: async ({ params }) => {
		let deleted = false;
		try {
			await tActions.import.delete({ db, id: params.id });
			deleted = true;
		} catch (e) {
			logging.error('Import Delete Error', JSON.stringify(e, null, 2));
		}

		if (deleted) {
			throw redirect(302, urlGenerator({ address: '/(loggedIn)/import' }).url);
		}
	}
};
