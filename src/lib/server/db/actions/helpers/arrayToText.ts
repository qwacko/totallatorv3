export const arrayToText = async ({
	data,
	singularName,
	inputToText = async (inValue) => inValue
}: {
	data: string[];
	singularName: string;
	inputToText?: (data: string[]) => Promise<string[]>;
}): Promise<string> => {
	if (data.length === 0) {
		return '';
	} else if (data.length === 1) {
		const convertedValue = (await inputToText([data[0]]))[0];
		return `${singularName} is ${convertedValue}`;
	} else if (data.length > 4) {
		return `${singularName} is one of ${data.length} values`;
	} else {
		const convertedValues = await inputToText(data);

		return `${singularName} is one of ${convertedValues.join(', ')}`;
	}
};
