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

export const fileTypeEnumInfo = {
	pdf: {
		id: 'pdf',
		name: 'PDF'
	},
	jpg: {
		id: 'jpg',
		name: 'JPG'
	},
	png: {
		id: 'png',
		name: 'PNG'
	},
	webp: {
		id: 'webp',
		name: 'WebP'
	},
	gif: {
		id: 'gif',
		name: 'GIF'
	},
	avif: {
		id: 'avif',
		name: 'AVIF'
	},
	tiff: {
		id: 'tiff',
		name: 'TIFF'
	},
	svg: {
		id: 'svg',
		name: 'SVG'
	},
	other: {
		id: 'other',
		name: 'Other'
	}
} satisfies {
	[key in FileTypeType]: {
		id: key;
		name: string;
	};
};

export type FileTypeInfoType = typeof fileTypeEnumInfo;

export const fileTypeDropdown = Object.values(fileTypeEnumInfo).map((option) => {
	return {
		name: option.name,
		value: option.id
	};
});

export const fileTypeToText = (fileType: FileTypeType) => {
	return fileTypeEnumInfo[fileType].name;
};
