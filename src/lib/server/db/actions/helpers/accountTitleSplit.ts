type AccountInfo = {
	accountGroupCombined: string;
	title: string;
};

export function accountTitleSplit(accountStr: string): AccountInfo {
	const parts = accountStr.split(':');

	// The last part is always the title
	const title = parts.pop() || '';

	// Join the remaining parts with ':' to form the combined accountGroupCombined
	const accountGroupCombined = parts.length ? parts.join(':') : '';

	return {
		accountGroupCombined,
		title
	};
}
