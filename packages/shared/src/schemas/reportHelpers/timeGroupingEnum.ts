export const timeGroupingEnum = ['year', 'month', 'quarter', 'day', 'week'] as const;

export type TimeGroupingType = (typeof timeGroupingEnum)[number];
