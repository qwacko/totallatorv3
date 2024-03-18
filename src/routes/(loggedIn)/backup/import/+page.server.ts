import { urlGenerator } from '$lib/routes.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { logging } from '$lib/server/logging.js';
import { redirect } from '@sveltejs/kit';
import { nanoid } from 'nanoid';

export const actions = {
	import: async ({ request, locals }) => {
		const formData = await request.formData();
		const backupFile = formData.get('backupFile') as File;

		const id = nanoid();

		try {
			await tActions.backup.importFile({ db: locals.db, backupFile, id });
		} catch (e) {
			logging.error(`Backup Import Failed. Incorrect Contents - ${backupFile.name}`);
			logging.error('Error', e);
			return;
		}

		redirect(302, urlGenerator({ address: '/(loggedIn)/backup/[id]', paramsValue: { id } }).url);
	}
};
