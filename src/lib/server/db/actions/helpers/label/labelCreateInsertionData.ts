import type { CreateLabelSchemaType } from '$lib/schema/labelSchema';
import { statusUpdate } from '../misc/statusUpdate';
import { updatedTime } from '../misc/updatedTime';

export const labelCreateInsertionData = (data: CreateLabelSchemaType, id: string) => {
	return {
		id,
		title: data.title,
		importId: data.importId,
		importDetailId: data.importDetailId,
		...statusUpdate(data.status),
		...updatedTime()
	};
};
