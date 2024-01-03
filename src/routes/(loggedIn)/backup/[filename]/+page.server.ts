import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo, urlGenerator } from '$lib/routes';
import { tActions } from '$lib/server/db/actions/tActions';
import { redirect } from '@sveltejs/kit';
import { logging } from '$lib/server/logging.js';

export const load = async (data) => {
	authGuard(data);
	const { current } = serverPageInfo(data.route.id, data);

	if (!current.params?.filename) {
		redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/backup', searchParamsValue: { page: 1 } }).url
		);
	}

	try {
		const backupInformation = await tActions.backup.getBackupDataStrutured({
			filename: current.params.filename
		});
		return { information: backupInformation.information };
	} catch (error) {
		logging.error('Error loading backup file: ' + error);
		redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/backup', searchParamsValue: { page: 1 } }).url
		);
	}
};

export const actions = {
	restore: async ({ request, params, locals }) => {
		const filename = params.filename;
		if (!filename) {
			throw new Error('No filename provided');
		}

		await tActions.backup.restoreBackup({ db: locals.db, filename, includeUsers: false });

		redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/backup', searchParamsValue: { page: 1 } }).url
		);
	},
	delete: async ({ request, params }) => {
		const filename = params.filename;
		if (!filename) {
			throw new Error('No filename provided');
		}

		await tActions.backup.deleteBackup(filename);

		redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/backup', searchParamsValue: { page: 1 } }).url
		);
	}
};
