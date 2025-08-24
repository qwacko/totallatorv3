export const sizeToText = (sizeValue: string | number | undefined | null) => {
	if (sizeValue === null || sizeValue === undefined) {
		return 'N/A';
	}
	const sizeNumber = Number(sizeValue);
	if (sizeNumber < 1000) {
		return `${sizeNumber.toFixed(1)}b`;
	}
	if (sizeNumber < 1000000) {
		return `${(sizeNumber / 1000).toFixed(1)}kb`;
	}
	return `${(sizeNumber / 1000000).toFixed(1)}Mb`;
};
