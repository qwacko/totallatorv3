export const fixedDelay = async (delay: number) => {
	await new Promise((resolve) => setTimeout(resolve, delay));
};
