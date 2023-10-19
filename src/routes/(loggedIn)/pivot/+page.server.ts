import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import { defaultPivotConfig } from '$lib/schema/journalSchema.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';

export const load = async (data) => {
	authGuard(data);
	const { current } = serverPageInfo(data.route.id, data);

	const pivotData = await tActions.journal.pivot({
		db,
		config: current.searchParams ? current.searchParams : defaultPivotConfig
	});

	return {
		data: pivotData
	};
};
