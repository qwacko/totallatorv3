import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { importMappingFilterToText } from '$lib/server/db/actions/helpers/import/importMappingFilterToQuery';
import { tActions } from '$lib/server/db/actions/tActions';
import { redirect } from '@sveltejs/kit';
import { logging } from '$lib/server/logging';

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;
	const { current, updateParams } = serverPageInfo(data.route.id, data);

	const importMappings = await tActions.importMapping.list({
		db,
		filter: current.searchParams || {}
	});

	const redirectRequired = importMappings.page >= importMappings.pageCount;
	if (redirectRequired) {
		const targetPage = Math.max(0, importMappings.pageCount - 1);
		redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
	}

	const filterText = await importMappingFilterToText(db, current.searchParams || {});

	return {
		importMappings,
		filterText,
		searchParams: current.searchParams
	};
};

export const actions = {
	default: async (data) => {
		const form = await data.request.formData();
		const importMappingId = form.get('importMappingId')?.toString();
		const action = form.get('action')?.toString();
		if (!importMappingId || !action) return;
		try {
			if (action === 'clone') {
				await tActions.importMapping.clone({ db: data.locals.db, id: importMappingId });
			}

			return;
		} catch (error) {
			logging.error(error);
			return;
		}
	}
};
