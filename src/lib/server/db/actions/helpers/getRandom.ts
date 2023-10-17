export const getRandomArrayElement = <T>(targetArray: T[]): T => {
	return targetArray[Math.floor(Math.random() * targetArray.length)];
};
export const getRandomBoolean = (threshold: number = 0.5) => Math.random() < threshold;
export const getRandomInteger = (maxInt: number = 10) => Math.ceil(Math.random() * maxInt);
export const getRandomDate = (start: Date, end: Date) => {
	return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};
