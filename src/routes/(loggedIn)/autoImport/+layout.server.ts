import { tActions } from '$lib/server/db/actions/tActions';

export const load = async (request) => {
	const importMappingDropdown = await tActions.importMapping.listForDropdown({
		db: request.locals.db
	});

	return {
		importMappingDropdown
	};
};
