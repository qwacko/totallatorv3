import { createNoteSchema } from '$lib/schema/noteSchema';
import { tActions } from '$lib/server/db/actions/tActions';
import { logging } from '$lib/server/logging';
import { type RequestEvent } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const noteFormActions = {
	addNote: async (data: RequestEvent<Partial<Record<string, string>>, string>) => {
		const form = await superValidate(data.request, zod(createNoteSchema));
		const creationPerson = data.locals.user?.id;

		if (!creationPerson) {
			throw new Error('User not found');
		}

		if (!form.valid) {
			return { form };
		}

		try {
			await tActions.note.create({
				db: data.locals.db,
				data: form.data,
				creationUserId: creationPerson
			});
		} catch (e) {
			logging.error('Error Creating Note', e);
		}
	},
	deleteNote: async (data: RequestEvent<Partial<Record<string, string>>, string>) => {
		const form = await data.request.formData();
		const noteId = form.get('noteId');
		if (!noteId) return;
		const noteIdString = noteId.toString();
		try {
			await tActions.note.deleteMany({ db: data.locals.db, filter: { idArray: [noteIdString] } });
		} catch (error) {
			logging.error('Error Deleting Note ', noteIdString, error);
		}
	}
};
