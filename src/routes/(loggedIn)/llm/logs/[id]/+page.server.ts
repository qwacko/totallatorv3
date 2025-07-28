import { authGuard } from '$lib/authGuard/authGuardConfig';
import { tActions } from '$lib/server/db/actions/tActions';
import { error } from '@sveltejs/kit';

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;
	const { id } = data.params;

	// Get the specific LLM log
	const log = await tActions.llmLog.getById({ db, id });

	if (!log) {
		error(404, 'LLM log not found');
	}

	return {
		log
	};
};
