import type {
	CreateCombinedTransactionType,
	CreateSimpleTransactionType
} from '@totallator/shared';

export const simpleSchemaToCombinedSchema = (
	data: CreateSimpleTransactionType
): CreateCombinedTransactionType => {
	const {
		toAccountId,
		toAccountTitle,
		fromAccountId,
		fromAccountTitle,
		amount,
		...sharedProperties
	} = data;

	return [
		{
			...sharedProperties,
			accountId: fromAccountId,
			accountTitle: fromAccountTitle,
			amount: -amount
		},
		{ ...sharedProperties, accountId: toAccountId, accountTitle: toAccountTitle, amount: amount }
	];
};
