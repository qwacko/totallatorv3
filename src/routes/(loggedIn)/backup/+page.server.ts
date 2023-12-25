import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo, urlGenerator } from '$lib/routes';
import { backupDB, deleteBackup, getBackupList, restoreDB } from '$lib/server/db/db.js';
import { redirect } from '@sveltejs/kit';

export const load = async (data) => {
	authGuard(data);
	const { current } = serverPageInfo(data.route.id, data);
	const allBackupFiles = await getBackupList();

	const perPage = 5;
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
	backup: async ({ request }) => {
		const formData = await request.formData();
		const backupName = formData.get('backupName')?.toString();

		const backupNameValidated = backupName && backupName.length > 0 ? backupName : 'Manual Backup';

		await backupDB(backupNameValidated);
	},
	restore: async ({ request }) => {
		const formData = await request.formData();
		const backupName = formData.get('backupName')?.toString();

		if (backupName) {
			await restoreDB(backupName);
		}
	},
	delete: async ({ request }) => {
		const formData = await request.formData();
		const backupName = formData.get('backupName')?.toString();

		if (backupName) {
			await deleteBackup(backupName);
		}
	}
};
