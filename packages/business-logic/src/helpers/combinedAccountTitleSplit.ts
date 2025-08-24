export const combinedAccountTitleSplitRequired = <
	Data extends { title: string; accountGroupCombined: string }
>({
	title,
	accountGroupCombined
}: Data) => {
	const [tempAccountGroup1, tempAccountGroup2, tempAccountGroup3] = accountGroupCombined.split(':');

	const accountGroup = tempAccountGroup1 || '';
	const accountGroup2 = tempAccountGroup2 || '';
	const accountGroup3 = tempAccountGroup3 || '';

	const accountTitleCombined =
		accountGroupCombined === '' ? title : `${accountGroupCombined}:${title}`;

	return {
		title,
		accountGroup: accountGroup || '',
		accountGroup2: accountGroup2 || '',
		accountGroup3: accountGroup3 || '',
		accountGroupCombined,
		accountTitleCombined
	};
};
