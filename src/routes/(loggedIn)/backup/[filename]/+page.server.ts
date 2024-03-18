import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo, urlGenerator } from '$lib/routes';
import { tActions } from '$lib/server/db/actions/tActions';
import { redirect } from '@sveltejs/kit';
import { logging } from '$lib/server/logging.js';
import { failWrapper } from '$lib/helpers/customEnhance';

export const load = async (data) => {
	authGuard(data);
	const { current } = serverPageInfo(data.route.id, data);

	if (!current.params?.filename) {
		redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/backup', searchParamsValue: { page: 1 } }).url
		);
	}

	const backupInformation = await tActions.backup.getBackupInfo({
		db: data.locals.db,
		filename: current.params.filename
	});

	if (!backupInformation) {
		redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/backup', searchParamsValue: { page: 1 } }).url
		);
	}

	return {
		information: backupInformation.information
	};
};

export const actions = {
	restore: async ({ request, params, locals }) => {
		const filename = params.filename;
		if (!filename) {
			return failWrapper('No filename provided');
		}

		try {
			await tActions.backup.restoreBackup({ db: locals.db, filename, includeUsers: false });
		} catch (e) {
			logging.error('Error Restoring Backup: ' + e);
			return failWrapper('Error Restoring Backup');
		}
		redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/backup', searchParamsValue: { page: 0 } }).url
		);
	},
	delete: async ({ request, params, locals }) => {
		const filename = params.filename;
		if (!filename) {
			return failWrapper('No filename provided');
		}

		try {
			await tActions.backup.deleteBackup({ filename, db: locals.db });
		} catch (e) {
			logging.error('Error Deleting Backup: ' + e);
			return failWrapper('Error Deleting Backup');
		}

		redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/backup', searchParamsValue: { page: 0 } }).url
		);
	}
};
