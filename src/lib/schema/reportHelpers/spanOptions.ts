export const spanOptions = ['all', 'upToRange', 'withinRange'] as const;
export type SpanOptionType = (typeof spanOptions)[number];
