export const statusEnum = ['active', 'disabled', 'deleted'] as const;
export const statusEnumWithoutDeleted = ['active', 'disabled'] as const;
export type StatusEnumType = (typeof statusEnum)[number];
export type StatusEnumWithoutDeletedType = (typeof statusEnumWithoutDeleted)[number];

export const statusEnumSelection = [
	{ value: 'active', name: 'Active' },
	{ value: 'disabled', name: 'Disabled' },
	{ value: 'deleted', name: 'Deleted' }
];

export const statusEnumSelectionWithoutDeleted = [
	{ value: 'active', name: 'Active' },
	{ value: 'disabled', name: 'Disabled' }
];

export const statusToDisplay = (status: StatusEnumType) => {
	return (
		statusEnumSelection.find((currentStatus) => currentStatus.value === status)?.name ?? status
	);
};
