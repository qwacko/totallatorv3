export const combinedTitle = <Data extends { title?: string }>({ title }: Data) => {
	if (title) {
		const [group, single] = title.split(':');
		return { title, group, single };
	}
	return {};
};
