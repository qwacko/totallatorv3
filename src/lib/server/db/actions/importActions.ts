import { logging } from '$lib/server/logging';
import { serverEnv } from '$lib/server/serverEnv';
import { nanoid } from 'nanoid';
import { writeFileSync } from 'fs';
import { db } from '../db';
import { importTable } from '../schema';
import { updatedTime } from './helpers/updatedTime';
import { eq } from 'drizzle-orm';

export const importActions = {
	storeCSV: async ({ newFile }: { newFile: File }) => {
		if (newFile.type !== 'text/csv') {
			throw new Error('Incorrect FileType');
		}
		logging.info('New Filename', newFile.name);

		const originalFilename = newFile.name;
		const id = nanoid();
		const dateTime = new Date().toISOString().slice(0, 10);

		const saveFilename = `${dateTime}_${id}_${originalFilename}`;
		const combinedFilename = `${serverEnv.IMPORT_DIR}${saveFilename}`;

		writeFileSync(combinedFilename, Buffer.from(await newFile.arrayBuffer()));

		await db
			.insert(importTable)
			.values({
				id,
				...updatedTime(),
				filename: combinedFilename,
				source: 'CSV Upload',
				title: originalFilename,
				complete: false,
				processed: false
			})
			.execute();

		return id;
	},
	get: async ({ id }: { id: string }) => {
		const data = await db.select().from(importTable).where(eq(importTable.id, id));

		return { importInfo: data[0] };
	}
};
