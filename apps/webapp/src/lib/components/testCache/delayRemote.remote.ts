import z from 'zod';

import { query } from '$app/server';

export const delayRemote = query(z.object({ test: z.string() }), async ({ test }) => {
	await new Promise((resolve) => setTimeout(resolve, 1000));
	return { test, time: new Date() };
});
