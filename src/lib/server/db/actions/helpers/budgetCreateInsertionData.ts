import type { CreateBudgetSchemaType } from '$lib/schema/budgetSchema';
import { statusUpdate } from './statusUpdate';
import { updatedTime } from './updatedTime';

export const budgetCreateInsertionData = (data: CreateBudgetSchemaType, id: string) => {
	return {
		id,
		importId: data.importId,
		importDetailId: data.importDetailId,
		...statusUpdate(data.status),
		...updatedTime(),
		title: data.title
	};
};
