import type { CreateBillSchemaType } from '$lib/schema/billSchema';
import { statusUpdate } from './statusUpdate';
import { updatedTime } from './updatedTime';

export const billCreateInsertionData = (data: CreateBillSchemaType, id: string) => {
	return {
		id,
		title: data.title,
		importId: data.importId,
		importDetailId: data.importDetailId,
		...statusUpdate(data.status),
		...updatedTime()
	};
};
