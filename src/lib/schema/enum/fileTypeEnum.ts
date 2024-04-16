export const fileTypeEnum = [
	'pdf',
	'jpg',
	'png',
	'webp',
	'gif',
	'avif',
	'tiff',
	'svg',
	'other'
] as const;
export type FileTypeType = (typeof fileTypeEnum)[number];
