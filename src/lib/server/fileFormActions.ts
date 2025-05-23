import { createFileSchema, updateFileSchema } from '$lib/schema/fileSchema';
import { tActions } from '$lib/server/db/actions/tActions';
import { formValidationActionWrapper } from './helpers/formValidationActionWrapper';
import { z } from 'zod';

export const fileFormActions = {
	addFile: formValidationActionWrapper({
		title: 'Create File',
		validation: createFileSchema,
		requireUser: true,
		action: async ({ db, data, userId }) => {
			await tActions.file.create({
				db,
				data,
				creationUserId: userId
			});
		}
	}),
	createFile: formValidationActionWrapper({
		title: 'Create File',
		validation: createFileSchema,
		requireUser: true,
		action: async ({ db, data, userId }) => {
			await tActions.file.create({
				db,
				data,
				creationUserId: userId
			});
		}
	}),
	updateFile: formValidationActionWrapper({
		title: 'Update File',
		validation: updateFileSchema,
		requireUser: true,
		action: async ({ db, data, userId }) => {
			await tActions.file.updateMany({
				db,
				filter: { idArray: [data.id] },
				update: data
			});
		}
	}),
	deleteFile: formValidationActionWrapper({
		title: 'Delete File',
		validation: z.object({
			fileId: z.string()
		}),
		requireUser: true,
		action: async ({ db, data, userId }) => {
			await tActions.file.deleteMany({
				db,
				filter: { idArray: [data.fileId] }
			});
		}
	})

	// }) async (data: RequestEvent<Partial<Record<string, string>>, string>) => {
	// 	const form = await superValidate(data.request, zod(createFileSchema));
	// 	const creationPerson = data.locals.user?.id;

	// 	if (!creationPerson) {
	// 		throw new Error('User not found');
	// 	}

	// 	if (!form.valid) {
	// 		return { form };
	// 	}

	// 	try {
	// 		await tActions.file.create({
	// 			db: data.locals.db,
	// 			data: form.data,
	// 			creationUserId: creationPerson
	// 		});
	// 	} catch (e) {
	// 		logging.error('Error Creating File', e);
	// 	}
	// },
	// updateFile: async (data: RequestEvent<Partial<Record<string, string>>, string>) => {
	// 	const form = await superValidate(data.request, zod(updateFileSchema));
	// 	if (!form.valid) {
	// 		return { form };
	// 	}

	// 	try {
	// 		await tActions.file.updateMany({
	// 			db: data.locals.db,
	// 			filter: { idArray: [form.data.id] },
	// 			update: form.data
	// 		});
	// 	} catch (e) {
	// 		logging.error('Error Updating File', e);
	// 	}
	// },
	// deleteFile: async (data: RequestEvent<Partial<Record<string, string>>, string>) => {
	// 	const form = await data.request.formData();
	// 	const fileId = form.get('fileId');
	// 	if (!fileId) return;
	// 	const fileIdString = fileId.toString();
	// 	try {
	// 		await tActions.file.deleteMany({ db: data.locals.db, filter: { idArray: [fileIdString] } });
	// 	} catch (error) {
	// 		logging.error('Error Deleting File ', fileIdString, error);
	// 	}
	// }
};
