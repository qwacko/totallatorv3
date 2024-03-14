import { urlGenerator } from '$lib/routes';
import { tActions } from '$lib/server/db/actions/tActions';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';

export const actions = {
	default: async ({ params, locals }) => {
		const db = locals.db;
		let deleted = false;
		try {
			await tActions.import.forgetImport({ db, id: params.id });
			deleted = true;
		} catch (e) {
			logging.error('Import Forget Error', JSON.stringify(e, null, 2));
		}

		if (deleted) {
			redirect(302, urlGenerator({ address: '/(loggedIn)/import', searchParamsValue: {} }).url);
		}
	}
};
