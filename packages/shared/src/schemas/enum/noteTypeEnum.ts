export const noteTypeEnum = ['info', 'reminder'] as const;
export type NoteTypeType = (typeof noteTypeEnum)[number];
