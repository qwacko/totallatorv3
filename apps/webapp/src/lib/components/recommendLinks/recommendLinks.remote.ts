import z from 'zod';

import { getContext } from '@totallator/context';

import { query } from '$app/server';

export const recommendTagRemote = query(z.object({ payee: z.string() }), async ({ payee }) => {
	const context = getContext();

	return { context: context.request.requestId };

	// Your implementation here
});
