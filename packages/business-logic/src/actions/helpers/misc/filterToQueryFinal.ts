export const filterToQueryFinal = ({
	stringArray,
	allText,
	prefix
}: {
	stringArray: string[];
	allText: boolean;
	prefix?: string;
}) => {
	if (stringArray.length === 0 && allText) {
		stringArray.push('Showing All');
	}

	if (prefix) {
		return stringArray.map((item) => `${prefix} ${item}`);
	}

	return stringArray;
};
