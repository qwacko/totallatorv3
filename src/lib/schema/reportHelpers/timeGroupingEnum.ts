export const timeGroupingEnum = ['year', 'month'] as const;

export type TimeGroupingType = (typeof timeGroupingEnum)[number];
