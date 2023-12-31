import { urlGenerator } from '$lib/routes.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { logging } from '$lib/server/logging.js';
import { serverEnv } from '$lib/server/serverEnv';
import { redirect } from '@sveltejs/kit';
import fs from 'fs/promises';

export const actions = {
	import: async ({ request }) => {
		const formData = await request.formData();
		const backupFile = formData.get('backupFile') as File;

		const targetFoler = serverEnv.BACKUP_DIR;

		//Store backup file into target folder, making sure to rename backup file if there is an existing file with the same name
		let backupFileName = backupFile.name;
		const backupFilePath = `${targetFoler}/${backupFileName}`;
		const backupFileExists = await fs.stat(backupFilePath).catch(() => false);
		if (backupFileExists) {
			const backupFileExtension = backupFileName.split('.').pop();
			const backupFileNameWithoutExtension = backupFileExtension
				? backupFileName.substring(0, backupFileName.length - backupFileExtension.length - 1)
				: backupFileName;
			const backupFileNameNew = `${backupFileNameWithoutExtension}-ImportDuplicate-${new Date().toISOString()}.${backupFileExtension}`;
			backupFileName = backupFileNameNew;
		}

		const targetFilename = `${targetFoler}/${backupFileName}`;

		await fs.writeFile(targetFilename, Buffer.from(await backupFile.arrayBuffer()));

		try {
			await tActions.backup.getBackupDataStrutured({ filename: backupFileName });
		} catch (e) {
			logging.error(`Backup Import Failed. Incorrect Contents - ${backupFileName}`);
			await fs.unlink(targetFilename);
			return;
		}

		redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/backup', searchParamsValue: { page: 0 } }).url
		);
	}
};
