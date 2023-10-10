export const splitArrayIntoChunks = <T>(array: T[], chunkSize: number) => {
	const numberChunks = Math.ceil(array.length / chunkSize);
	const chunks = Array(numberChunks)
		.fill(0)
		.map((_, i) => {
			return array.slice(i * chunkSize, (i + 1) * chunkSize);
		});

	return chunks;
};
