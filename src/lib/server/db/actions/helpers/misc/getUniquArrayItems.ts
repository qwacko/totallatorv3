export function getUniqueItems(
	list1: string[],
	list2: string[]
): { onlyInList1: string[]; onlyInList2: string[] } {
	const set1 = new Set(list1);
	const set2 = new Set(list2);

	const onlyInList1 = [...set1].filter((item) => !set2.has(item));
	const onlyInList2 = [...set2].filter((item) => !set1.has(item));

	return { onlyInList1, onlyInList2 };
}
