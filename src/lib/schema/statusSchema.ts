export const statusEnum = ['active', 'disabled', 'deleted'] as const;
export const statusEnumWithoutDeleted = ['active', 'disabled'] as const;
export type StatusEnumType = (typeof statusEnum)[number];
export type StatusEnumWithoutDeletedType = (typeof statusEnumWithoutDeleted)[number];
