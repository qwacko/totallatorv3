import { urlGenerator } from '$lib/routes.js';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { db } from '$lib/server/db/db';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';

export const actions = {
	create: async ({ request }) => {
		const formData = Object.fromEntries(await request.formData());

		let newId: undefined | string = undefined;

		try {
			const uploadedFile = formData.csvFile as File | undefined;
			if (!uploadedFile) {
				return fail(400, { message: 'No File Uploaded' });
			} else {
				newId = await tActions.import.storeCSV({ newFile: uploadedFile, db });
			}
		} catch (e) {
			console.log('Error:', e);
			const parsedError = z.object({ message: z.string() }).safeParse(e);
			if (parsedError.success) {
				return fail(400, { message: parsedError.data.message });
			}
			return fail(400, { message: 'Unknown Error Loading File' });
		}
		if (newId) {
			throw redirect(
				302,
				urlGenerator({ address: '/(loggedIn)/import/[id]', paramsValue: { id: newId } }).url
			);
		}
		return fail(400, { message: 'Unknown Error. Not Processed' });
	}
};
