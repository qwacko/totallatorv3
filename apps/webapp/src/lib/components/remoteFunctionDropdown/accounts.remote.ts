import z from 'zod';

import { tActions } from '@totallator/business-logic';

import { query } from '$app/server';

export const accountsQuery = query(
	z.object({
		search: z.string().min(0).max(100),
		count: z.number().min(1).max(100).optional().default(10)
	}),
	async ({ search, count }) => {
		const accounts = await tActions.account.list({
			filter: {
				accountTitleCombined: search,
				page: 0,
				pageSize: count
			}
		});

		return accounts.data.map((account) => ({
			id: account.id,
			title: account.title,
			group: account.accountGroupCombined,
			disabled: !account.active
		}));
	}
);

export const singleAccountQuery = query(
	z.object({
		id: z.string().min(1).max(100)
	}),
	async ({ id }) => {
		const account = await tActions.account.getById(id);
		if (!account) {
			return null;
		}
		return {
			id: account.id,
			title: account.title,
			group: account.accountGroupCombined,
			disabled: !account.active
		};
	}
);
