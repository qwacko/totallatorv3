import { query } from '$app/server';

import { tActions } from '@totallator/business-logic';
import { importTransactionHistoryQuerySchema } from '@totallator/shared';

export const getImportTransactionHistory = query(
	importTransactionHistoryQuerySchema,
	async ({ importId }) => {
		return await tActions.transactionChange.listByImportId({ importId });
	}
);
