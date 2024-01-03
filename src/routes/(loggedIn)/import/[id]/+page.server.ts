import { importTypeEnum, type importTypeType } from '$lib/schema/importSchema.js';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { importTable } from '$lib/server/db/postgres/schema';
import { logging } from '$lib/server/logging';

import { eq } from 'drizzle-orm';

export const actions = {
	reprocess: async ({ params, locals }) => {
		try {
			await tActions.import.reprocess({ db: locals.db, id: params.id });
		} catch (e) {
			logging.error('Reprocess Import Error', JSON.stringify(e, null, 2));
		}
	},
	doImport: async ({ params, locals }) => {
		try {
			await tActions.import.doImport({ db: locals.db, id: params.id });
		} catch (e) {
			logging.error('Do Import Error: ', JSON.stringify(e, null, 2));
			await locals.db
				.update(importTable)
				.set({ status: 'error', errorInfo: e })
				.where(eq(importTable.id, params.id));
		}
	},
	updateImportType: async ({ params, request, locals }) => {
		const form = await request.formData();
		const formType = form.get('type')?.toString();

		try {
			if (formType && importTypeEnum.includes(formType as importTypeType)) {
				await tActions.import.changeType({
					db: locals.db,
					id: params.id,
					newType: formType as importTypeType
				});
			}
		} catch (e) {
			logging.error('Update Import Type Error: ', JSON.stringify(e, null, 2));
		}
	}
};
