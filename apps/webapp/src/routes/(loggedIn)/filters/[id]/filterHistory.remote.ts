import { query } from '$app/server';

import { tActions } from '@totallator/business-logic';
import { filterTransactionHistoryQuerySchema } from '@totallator/shared';

export const getFilterTransactionHistory = query(
	filterTransactionHistoryQuerySchema,
	async ({ filterId }) => {
		return await tActions.transactionChange.listByFilterId({ filterId });
	}
);
