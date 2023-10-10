import { logging } from '$lib/server/logging';

export const getCommonData = <
	T extends string,
	U extends Record<T, string | number | undefined | null | Date | boolean>
>(
	key: T,
	data: U[],
	log = false
) => {
	const targetSet = [...new Set(data.map((item) => item[key]))];

	if (log) {
		logging.info('Target Set : ', targetSet, ' - Length - ', targetSet.length);
	}

	if (targetSet.length === 1) {
		return targetSet[0];
	}
	return undefined;
};
