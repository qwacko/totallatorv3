import type { CreateBillSchemaType } from '$lib/schema/billSchema';
import { getRandomInteger } from './getRandom';

export const createBill = (): CreateBillSchemaType => {
	return {
		title: `BillTitle${getRandomInteger(500)}`,
		status: 'active'
	};
};
