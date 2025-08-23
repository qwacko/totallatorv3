export const highlightText = (text: string, searchTerm: string | undefined): string => {
	if (!searchTerm || !text) return text;
	const regex = new RegExp('(' + searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
	return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
};
