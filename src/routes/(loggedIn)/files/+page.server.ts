import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { extractAutocompleteFromTextFilter } from '$lib/server/helpers/filterConfigExtractor.js';
import { fileMainFilterArray } from '$lib/server/db/actions/helpers/file/fileTextFilter.js';

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

	// Generate autocomplete configuration from server-side filter array
	const autocompleteKeys = extractAutocompleteFromTextFilter(fileMainFilterArray, 'file');

	return { searchParams: current.searchParams, files, filterText, autocompleteKeys };
};

export const actions = {
	checkFiles: async (data) => {
		await tActions.file.checkFilesExist({ db: data.locals.db });
	}
};
