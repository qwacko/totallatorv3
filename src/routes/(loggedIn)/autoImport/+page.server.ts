import { authGuard } from '$lib/authGuard/authGuardConfig';
import { tActions } from '$lib/server/db/actions/tActions';
import { serverPageInfo } from '$lib/routes';
import { logging } from '$lib/server/logging.js';
import { noteFormActions } from '$lib/server/noteFormActions';
import { fileFormActions } from '$lib/server/fileFormActions';
import { associatedInfoFormActions } from '$lib/server/associatednfoFormActions.js';

export const load = async (request) => {
	authGuard(request);
	const { current } = serverPageInfo(request.route.id, request);

	const filter = current.searchParams || {};

	const autoImportList = await tActions.autoImport.list({
		db: request.locals.db,
		filter
	});

	return {
		list: await tActions.file.addToItems({
			db: request.locals.db,
			grouping: 'autoImport',
			data: await tActions.note.addToItems({
				db: request.locals.db,
				data: autoImportList,
				grouping: 'autoImport'
			})
		}),
		filter
	};
};

export const actions = {
	...noteFormActions,
	...fileFormActions,
	...associatedInfoFormActions,
	clone: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id');

		if (!id) {
			return;
		}

		try {
			await tActions.autoImport.clone({
				db: locals.db,
				id: id.toString()
			});
		} catch (e) {
			logging.error('Error Cloning Auto Import', e);
		}
	}
};
