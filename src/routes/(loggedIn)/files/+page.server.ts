import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { tActions } from '$lib/server/db/actions/tActions.js';

export const load = async (data) => {
	authGuard(data);
	const { current } = serverPageInfo(data.route.id, data);

	const files = await tActions.file.list({
		db: data.locals.db,
		filter: current.searchParams || { page: 0, pageSize: 10 }
	});

	const filterText = await tActions.file.filterToText({
		db: data.locals.db,
		filter: current.searchParams || { page: 0, pageSize: 10 }
	});

	return { searchParams: current.searchParams, files, filterText };
};

export const actions = {
	checkFiles: async (data) => {
		await tActions.file.checkFilesExist({ db: data.locals.db });
	}
};
