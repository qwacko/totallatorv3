import z from 'zod';

import { tActions } from '@totallator/business-logic';

import { query } from '$app/server';

export const recommendTagRemote = query(z.object({ payee: z.string() }), async ({ payee }) => {
	const recommendations = await tActions.tag.listRecommendationsFromPayee({ payeeId: payee });

	return { recommendations };
});

export const recommendBillRemote = query(z.object({ payee: z.string() }), async ({ payee }) => {
	const recommendations = await tActions.bill.listRecommendationsFromPayee({ payeeId: payee });

	return { recommendations };
});

export const recommendBudgetRemote = query(z.object({ payee: z.string() }), async ({ payee }) => {
	const recommendations = await tActions.budget.listRecommendationsFromPayee({ payeeId: payee });

	return { recommendations };
});

export const recommendCategoryRemote = query(z.object({ payee: z.string() }), async ({ payee }) => {
	const recommendations = await tActions.category.listRecommendationsFromPayee({ payeeId: payee });

	return { recommendations };
});
