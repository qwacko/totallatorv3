import { urlGenerator } from '$lib/routes.js';
import { importTypeEnum, type importTypeType } from '$lib/schema/importSchema.js';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { logging } from '$lib/server/logging';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';

export const actions = {
	create: async ({ request, locals }) => {
		const db = locals.db;
		const formData = Object.fromEntries(await request.formData());

		let newId: undefined | string = undefined;
		console.log('Create Form Data', formData);
		const checkImportedOnly = formData.checkImportedOnly === 'on';

		try {
			const uploadType = formData.importType as importTypeType | undefined;
			const uploadedMapping = formData.importMappingId as string | undefined;
			if (uploadType === 'mappedImport' && !uploadedMapping) {
				return fail(400, { message: 'No Mapping Selected' });
			}
			if (uploadedMapping) {
				const result = await tActions.importMapping.getById({ db, id: uploadedMapping });
				if (!result) {
					return fail(400, { message: `Mapping ${uploadedMapping} Not Found` });
				}
			}
			const uploadedFile = formData.csvFile as File | undefined;
			if (!uploadedFile || !uploadType || !importTypeEnum.includes(uploadType)) {
				return fail(400, { message: 'No File Uploaded' });
			} else {
				newId = await tActions.import.storeCSV({
					newFile: uploadedFile,
					db,
					type: uploadType,
					importMapping: uploadedMapping,
					checkImportedOnly
				});
			}
		} catch (e) {
			logging.error('Import Create Error', JSON.stringify(e, null, 2));
			const parsedError = z.object({ message: z.string() }).safeParse(e);
			if (parsedError.success) {
				return fail(400, { message: parsedError.data.message });
			}
			return fail(400, { message: 'Unknown Error Loading File' });
		}
		if (newId) {
			redirect(
				302,
				urlGenerator({ address: '/(loggedIn)/import/[id]', paramsValue: { id: newId } }).url
			);
		}
		return fail(400, { message: 'Unknown Error. Not Processed' });
	}
};
