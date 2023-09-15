type OrderByType<Options extends string> = { field: Options; direction: 'asc' | 'desc' }[];

export const modifyOrderBy = <Options extends string>(
	currentOrder: OrderByType<Options> | undefined,
	key: Options
): OrderByType<Options> => {
	const currentSetting = currentOrder
		? currentOrder.find((order) => order.field === key)
		: undefined;

	if (currentSetting && currentOrder) {
		if (currentSetting.direction === 'asc') {
			return currentOrder.map((order) => {
				if (order.field === key) {
					return { field: key, direction: 'desc' };
				} else {
					return order;
				}
			});
		} else {
			return currentOrder.filter((order) => order.field !== key);
		}
	}
	if (currentOrder) {
		return [...currentOrder, { field: key, direction: 'asc' }];
	}
	return [{ field: key, direction: 'asc' }];
};

export const getOrderBy = <Options extends string>(
	currentOrder: OrderByType<Options> | undefined,
	key: Options
) => {
	const currentSetting = currentOrder
		? currentOrder.find((order) => order.field === key)
		: undefined;

	if (currentSetting) {
		return currentSetting.direction;
	}
	return undefined;
};
