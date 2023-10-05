import type { CreateLabelSchemaType } from '$lib/schema/labelSchema';
import { statusUpdate } from './statusUpdate';
import { updatedTime } from './updatedTime';

export const labelCreateInsertionData = (data: CreateLabelSchemaType, id: string) => {
	return {
		id,
		title: data.title,
		...statusUpdate(data.status),
		...updatedTime()
	};
};