import type { CreateBudgetSchemaType } from '@totallator/shared';
import { statusUpdate } from '../misc/statusUpdate';
import { updatedTime } from '../misc/updatedTime';

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
