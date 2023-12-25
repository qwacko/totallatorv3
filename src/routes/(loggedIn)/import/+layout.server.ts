import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';

export const load = async () => {
	const importMappingDropdown = await tActions.importMapping.listForDropdown({ db });
	return {
		importMappingDropdown
	};
};
