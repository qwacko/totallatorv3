import { query } from '$app/server';

import { tActions } from '@totallator/business-logic';
import { transactionHistoryQuerySchema } from '@totallator/shared';

export const getTransactionHistory = query(transactionHistoryQuerySchema, async ({ transactionId }) => {
	return await tActions.transactionChange.listByTransactionId({ transactionId });
});
