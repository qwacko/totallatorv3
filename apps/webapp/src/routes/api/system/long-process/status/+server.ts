import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

import { getWriteLock, isWriteLockEnabled } from '$lib/server/longProcess/state';

export const GET: RequestHandler = async () => {
	const lock = await getWriteLock();

	return json({
		writeLockEnabled: isWriteLockEnabled(),
		locked: Boolean(lock),
		lock
	});
};
