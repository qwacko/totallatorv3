export type OrderByType<Options extends string> = {
	field: Options;
	direction: 'asc' | 'desc';
}[];

export const modifyOrderBy = <Options extends string>(
	currentOrder: OrderByType<Options> | undefined,
	key: Options,
	action: 'add' | 'toggle' | 'toggleOnly' | 'remove' = 'toggle'
): OrderByType<Options> => {
	const currentSetting = currentOrder
		? currentOrder.find((order) => order.field === key)
		: undefined;

	if (action === 'add') {
		if (!currentOrder) {
			return [{ field: key, direction: 'asc' }];
		}
		if (!currentSetting) {
			return [...currentOrder, { field: key, direction: 'asc' }];
		}
		return currentOrder;
	}
	if (action === 'remove') {
		if (!currentOrder) {
			return [];
		}
		return currentOrder.filter((order) => order.field !== key);
	}
	if (action === 'toggleOnly') {
		if (!currentOrder) {
			return [];
		}
		return currentOrder.map((order) => {
			if (order.field === key) {
				return {
					field: key,
					direction: order.direction === 'asc' ? 'desc' : 'asc'
				};
			} else {
				return order;
			}
		});
	}
	if (action === 'toggle') {
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
	}
	return [];
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
