import { authGuard } from '$lib/authGuard/authGuardConfig';
import { tActions } from '$lib/server/db/actions/tActions';
import { serverPageInfo } from '$lib/routes';
import { redirect } from '@sveltejs/kit';
import { urlGenerator } from '$lib/routes';

export const load = async (request) => {
	authGuard(request);
	const { current } = serverPageInfo(request.route.id, request);

	if (!current.params || !current.params.id) {
		redirect(302, urlGenerator({ address: '/(loggedIn)/autoImport', searchParamsValue: {} }).url);
	}

	const autoImportDetail = await tActions.autoImport.getById({
		db: request.locals.db,
		id: current.params.id
	});

	if (!autoImportDetail) {
		redirect(302, urlGenerator({ address: '/(loggedIn)/autoImport', searchParamsValue: {} }).url);
	}

	return {
		autoImportDetail,
		id: current.params.id
	};
};

export const actions = {
	default: async (request) => {
		const id = request.params.id;

		try {
			await tActions.autoImport.delete({
				db: request.locals.db,
				id
			});
		} catch (error) {
			console.error('Error deleting autoImport', error);

			return;
		}

		return redirect(
			302,
			urlGenerator({ address: '/(loggedIn)/autoImport', searchParamsValue: {} }).url
		);
	}
};
