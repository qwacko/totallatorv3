export const numericToNumber = (value: string) => {
	if (!value) {
		return 0;
	}

	return Number(value);
};

export const numberToNumeric = (value: number) => {
	if (!value) {
		return '0';
	}

	return value.toString();
};
