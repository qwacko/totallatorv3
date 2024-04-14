export const fileOrderByEnum = [
	'title',
	'reason',
	'filename',
	'size',
	'exists',
	'linked',
	'type',
	'createdAt',
	'updatedAt'
] as const;

type FileOrderByEnumType = (typeof fileOrderByEnum)[number];

type FileOrderByEnumTitles = {
	[K in FileOrderByEnumType]: string;
};

// This will be valid for demonstration purposes
const fileEnumTitles: FileOrderByEnumTitles = {
	title: 'Title',
	reason: 'Reason',
	filename: 'Filename',
	size: 'Size',
	exists: 'Exists',
	linked: 'Linked',
	type: 'Type',
	createdAt: 'Created At',
	updatedAt: 'Updated At'
};

export const fileOrderByEnumToText = (input: FileOrderByEnumType) => {
	return fileEnumTitles[input];
};
