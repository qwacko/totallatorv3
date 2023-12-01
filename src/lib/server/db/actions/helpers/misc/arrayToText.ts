export const arrayToText = async ({
	data,
	singularName,
	inputToText = async (inValue) => inValue
}: {
	data: string[];
	singularName?: string;
	inputToText?: (data: string[]) => Promise<string[]>;
}): Promise<string> => {
	const prefix = singularName ? `${singularName} is` : 'Is';
	if (data.length === 0) {
		return '';
	} else if (data.length === 1) {
		const singleTitle = inputToText ? await inputToText([data[0]]) : undefined;
		const convertedValue = singleTitle ? singleTitle[0] : data[0];
		return `${prefix} ${convertedValue}`;
	} else if (data.length > 4) {
		return `${prefix} one of ${data.length} values`;
	} else {
		const convertedValues = await inputToText(data);

		return `${prefix} one of ${convertedValues.join(', ')}`;
	}
};
