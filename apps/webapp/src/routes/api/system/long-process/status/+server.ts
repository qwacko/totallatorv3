import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

import { getLongProcessSnapshot } from '$lib/server/longProcess/state';

export const GET: RequestHandler = async () => {
	const snapshot = await getLongProcessSnapshot();
	return json(snapshot);
};
