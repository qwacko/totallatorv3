import { urlGenerator } from '$lib/routes';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';
import { redirect } from '@sveltejs/kit';

export const actions = {
	default: async ({ params }) => {
		let deleted = false;
		try {
			await tActions.import.forgetImport({ db, id: params.id });
			deleted = true;
		} catch (e) {
			console.log(e);
		}

		if (deleted) {
			throw redirect(302, urlGenerator({ address: '/(loggedIn)/import' }).url);
		}
	}
};
