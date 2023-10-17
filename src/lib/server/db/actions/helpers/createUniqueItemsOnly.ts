export const createUniqueItemsOnly = <T extends Record<string, string>>({
	existing,
	creationToString,
	createItem,
	count
}: {
	existing: string[];
	creationToString: (creation: T) => string;
	count: number;
	createItem: () => T;
}) => {
	const returnList: T[] = [];
	const internalExisting = [...existing];
	for (let j = 0; j < count; j++) {
		for (let i = 0; i < 10; i++) {
			const item = createItem();
			const newString = creationToString(item);
			if (!internalExisting.find((currentItem) => currentItem === newString)) {
				returnList.push(item);
				internalExisting.push(item.title);
				break;
			}
		}
	}
	return returnList;
};
