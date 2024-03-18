import { urlGenerator } from '$lib/routes.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { backupFileHandler } from '$lib/server/files/fileHandler.js';
import { logging } from '$lib/server/logging.js';
import { redirect } from '@sveltejs/kit';

export const actions = {
	import: async ({ request }) => {
		const formData = await request.formData();
		const backupFile = formData.get('backupFile') as File;

		//Store backup file into target folder, making sure to rename backup file if there is an existing file with the same name
		let backupFileName = backupFile.name;
		const backupFileExists = await backupFileHandler.fileExists(backupFileName);
		if (backupFileExists) {
			const backupFileExtension = backupFileName.split('.').pop();
			const backupFileNameWithoutExtension = backupFileExtension
				? backupFileName.substring(0, backupFileName.length - backupFileExtension.length - 1)
				: backupFileName;
			const backupFileNameNew = `${backupFileNameWithoutExtension}-ImportDuplicate-${new Date().toISOString()}.${backupFileExtension}`;
			backupFileName = backupFileNameNew;
		}

		await backupFileHandler.write(backupFileName, Buffer.from(await backupFile.arrayBuffer()));

		try {
			await tActions.backup.getBackupDataStrutured({ filename: backupFileName });
		} catch (e) {
			logging.error(`Backup Import Failed. Incorrect Contents - ${backupFileName}`);
			logging.error('Error', e);
			await backupFileHandler.deleteFile(backupFileName);
			return;
		}

		redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/backup', searchParamsValue: { page: 0 } }).url
		);
	}
};
