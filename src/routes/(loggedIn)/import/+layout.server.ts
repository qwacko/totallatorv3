import { tActions } from '$lib/server/db/actions/tActions';

export const load = async ({ locals }) => {
	const importMappingDropdown = await tActions.importMapping.listForDropdown({ db: locals.db });
	return {
		importMappingDropdown
	};
};
