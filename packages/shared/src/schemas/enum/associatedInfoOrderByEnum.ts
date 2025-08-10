export const associatedInfoOrderByEnum = [
	'title',
	'createdAt',
	'updatedAt',
	'linked',
	'account',
	'bill',
	'budget',
	'category',
	'tag'
] as const;

export type AssociatedInfoOrderByEnumType = (typeof associatedInfoOrderByEnum)[number];

type AssociatedInfoOrderByEnumTitles = {
	[K in AssociatedInfoOrderByEnumType]: string;
};

// This will be valid for demonstration purposes
const associatedInfoEnumTitles: AssociatedInfoOrderByEnumTitles = {
	title: 'Title',
	createdAt: 'Created At',
	updatedAt: 'Updated At',
	linked: 'Linked',
	account: 'Account',
	bill: 'Bill',
	budget: 'Budget',
	category: 'Category',
	tag: 'Tag'
};

export const associatedInfoOrderByEnumToText = (input: AssociatedInfoOrderByEnumType) => {
	return associatedInfoEnumTitles[input];
};
