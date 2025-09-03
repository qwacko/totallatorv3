import z from 'zod';

import { tActions } from '@totallator/business-logic';

import { query } from '$app/server';

export const recommendTextFromAccount = query(z.object({ payeeId: z.string() }), async (input) => {
	const recommendations = await tActions.journal.getTextRecommendationsFromAccountId({
		payeeId: input.payeeId
	});

	return { recommendations };
});
