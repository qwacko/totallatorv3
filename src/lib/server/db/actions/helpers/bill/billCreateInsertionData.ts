import type { CreateBillSchemaType } from '$lib/schema/billSchema';
import { statusUpdate } from '../misc/statusUpdate';
import { updatedTime } from '../misc/updatedTime';

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
