import * as z from 'zod';

export const statusEnum = ['active', 'disabled'] as const;
export const statusEnumWithoutDeleted = ['active', 'disabled'] as const;
export type StatusEnumType = (typeof statusEnum)[number];
export type StatusEnumWithoutDeletedType = (typeof statusEnumWithoutDeleted)[number];

export const statusEnumSelection = [
	{ value: 'active', name: 'Active' },
	{ value: 'disabled', name: 'Disabled' }
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

export const statusSchema = z.enum(statusEnum);
