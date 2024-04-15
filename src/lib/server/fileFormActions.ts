import { createFileSchema } from '$lib/schema/fileSchema';
import { tActions } from '$lib/server/db/actions/tActions';
import { logging } from '$lib/server/logging';
import { type RequestEvent } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const fileFormActions = {
	addFile: async (data: RequestEvent<Partial<Record<string, string>>, string>) => {
		const form = await superValidate(data.request, zod(createFileSchema));
		const creationPerson = data.locals.user?.id;

		if (!creationPerson) {
			throw new Error('User not found');
		}

		if (!form.valid) {
			return { form };
		}

		try {
			await tActions.file.create({
				db: data.locals.db,
				file: form.data,
				creationUserId: creationPerson
			});
		} catch (e) {
			logging.error('Error Creating File', e);
		}
	},
	deleteFile: async (data: RequestEvent<Partial<Record<string, string>>, string>) => {
		const form = await data.request.formData();
		const fileId = form.get('fileId');
		if (!fileId) return;
		const fileIdString = fileId.toString();
		try {
			await tActions.file.deleteMany({ db: data.locals.db, filter: { idArray: [fileIdString] } });
		} catch (error) {
			logging.error('Error Deleting File ', fileIdString, error);
		}
	}
};
