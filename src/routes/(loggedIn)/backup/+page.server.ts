import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo, urlGenerator } from '$lib/routes';
import { tActions } from '$lib/server/db/actions/tActions';
import { redirect } from '@sveltejs/kit';
import { failWrapper } from '$lib/helpers/customEnhance';

export const load = async (data) => {
	authGuard(data);
	const { current } = serverPageInfo(data.route.id, data);
	const allBackupFiles = await tActions.backup.list();

	const perPage = 20;
	const page = current.searchParams ? current.searchParams.page : 0;
	const numberOfBackups = allBackupFiles.length;

	const numPages = Math.ceil(numberOfBackups / perPage);

	if (numPages === 0 && page !== 0) {
		redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/backup', searchParamsValue: { page: 0 } }).url
		);
	}

	if (page >= numPages && numPages > 0) {
		redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/backup', searchParamsValue: { page: numPages - 1 } }).url
		);
	}

	const backupFiles = current.searchParams
		? allBackupFiles.slice(
				current.searchParams.page * perPage,
				(current.searchParams.page + 1) * perPage
			)
		: allBackupFiles.slice(0, perPage);

	return { backupFiles, numberOfBackups, page, perPage, numPages };
};

export const actions = {
	backup: async ({ request, locals }) => {
		try {
			const db = locals.db;
			const formData = await request.formData();
			const backupName = formData.get('backupName')?.toString();

			const backupNameValidated =
				backupName && backupName.length > 0 ? backupName : 'Manual Backup';

			await tActions.backup.storeBackup({
				db: db,
				title: backupNameValidated,
				compress: true,
				createdBy: 'User',
				creationReason: 'Manual Backup'
			});
		} catch (e) {
			console.error('Error creating backup: ' + e);
			return failWrapper('Error creating backup');
		}
		return;
	},
	backupUncompressed: async ({ request, locals }) => {
		try {
			const db = locals.db;
			const formData = await request.formData();
			const backupName = formData.get('backupName')?.toString();

			const backupNameValidated =
				backupName && backupName.length > 0 ? backupName : 'Manual Backup';

			await tActions.backup.storeBackup({
				db: db,
				title: backupNameValidated,
				compress: false,
				createdBy: 'User',
				creationReason: 'Manual Backup'
			});
		} catch (e) {
			console.error('Error creating backup: ' + e);
			return failWrapper('Error creating backup');
		}
		return;
	}
};
