import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo, urlGenerator } from '$lib/routes';
import { tActions } from '$lib/server/db/actions/tActions';
import { redirect } from '@sveltejs/kit';
import { logging } from '$lib/server/logging.js';
import { failWrapper } from '$lib/helpers/customEnhance';

export const load = async (data) => {
	authGuard(data);
	const { current } = serverPageInfo(data.route.id, data);

	if (!current.params?.id) {
		redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/backup', searchParamsValue: { page: 1 } }).url
		);
	}

	const backupInformation = await tActions.backup.getBackupInfo({
		db: data.locals.db,
		id: current.params.id
	});

	if (!backupInformation) {
		redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/backup', searchParamsValue: { page: 1 } }).url
		);
	}

	return {
		information: backupInformation.information,
		backupInformation
	};
};

export const actions = {
	lock: async ({ request, params, locals }) => {
		const id = params.id;
		if (!id) {
			return;
		}
		try {
			await tActions.backup.lock({ db: locals.db, id });
		} catch (e) {
			logging.error('Error Locking Backup: ' + e);
		}
		return;
	},
	unlock: async ({ request, params, locals }) => {
		const id = params.id;
		if (!id) {
			return;
		}
		try {
			await tActions.backup.unlock({ db: locals.db, id });
		} catch (e) {
			logging.error('Error Unlocking Backup: ' + e);
		}
		return;
	},
	updateTitle: async ({ request, params, locals }) => {
		const id = params.id;
		if (!id) {
			return;
		}
		const formData = await request.formData();
		const title = formData.get('title') as string;
		if (!title) {
			return;
		}
		try {
			await tActions.backup.updateTitle({ db: locals.db, id, title });
		} catch (e) {
			logging.error('Error Updating Backup Title: ' + e);
		}
		return;
	},
	restore: async ({ request, params, locals }) => {
		const id = params.id;
		if (!id) {
			return failWrapper('No ID provided');
		}

		try {
			await tActions.backup.restoreBackup({ db: locals.db, id, includeUsers: false });
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
		const id = params.id;
		if (!id) {
			return failWrapper('No filename provided');
		}

		try {
			await tActions.backup.deleteBackup({ id, db: locals.db });
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
