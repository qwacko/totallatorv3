export const noteOrderByEnum = ['note', 'type', 'createdAt', 'updatedAt'] as const;

export type NoteOrderByEnumType = (typeof noteOrderByEnum)[number];

type NoteOrderByEnumTitles = {
	[K in NoteOrderByEnumType]: string;
};

// This will be valid for demonstration purposes
const noteEnumTitles: NoteOrderByEnumTitles = {
	note: 'Note',
	type: 'Type',
	createdAt: 'Created At',
	updatedAt: 'Updated At'
};

export const noteOrderByEnumToText = (input: NoteOrderByEnumType) => {
	return noteEnumTitles[input];
};
