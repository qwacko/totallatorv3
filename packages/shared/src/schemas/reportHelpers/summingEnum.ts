export const summingEnum = ['count', 'sum'] as const;
export type SummingEnumType = (typeof summingEnum)[number];
