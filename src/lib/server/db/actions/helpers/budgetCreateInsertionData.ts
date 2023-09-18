import type { CreateBudgetSchemaType } from '$lib/schema/budgetSchema';
import { statusUpdate } from './statusUpdate';
import { updatedTime } from './updatedTime';

export const budgetCreateInsertionData = (data: CreateBudgetSchemaType, id: string) => {
	return {
		id,
		...statusUpdate(data.status),
		...updatedTime(),
		title: data.title
	};
};
