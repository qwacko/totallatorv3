export const accountTypeEnum = ['income', 'expense', 'asset', 'liability'] as const;

export type AccountTypeEnumType = (typeof accountTypeEnum)[number];

export const accountTypeEnumSelection = [
	{ value: 'income', name: 'Income' },
	{ value: 'expense', name: 'Expense' },
	{ value: 'asset', name: 'Asset' },
	{ value: 'liability', name: 'Liability' }
] satisfies { value: AccountTypeEnumType; name: string }[];

export const accountTypeToDisplay = (status: AccountTypeEnumType) => {
	return (
		accountTypeEnumSelection.find((currentStatus) => currentStatus.value === status)?.name ?? status
	);
};
