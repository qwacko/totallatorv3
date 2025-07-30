/**
 * Creates unique items based on the provided parameters. Developed for database seeding.
 *
 * @template T - The type of the items to be created.
 * @param {Object} options - The options for creating unique items.
 * @param {string[]} options.existing - The array of existing items.
 * @param {(creation: T) => string} options.creationToString - The function that converts a created item to a string.
 * @param {number} options.count - The number of unique items to create.
 * @param {() => T} options.createItem - The function that creates a new item.
 * @returns {T[]} - The array of unique items.
 */
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
