export const fileTypeEnum = ['pdf', 'jpg', 'png', 'other'] as const;
export type FileTypeType = (typeof fileTypeEnum)[number];
