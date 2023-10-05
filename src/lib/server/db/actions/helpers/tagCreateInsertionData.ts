import type { CreateTagSchemaType } from '$lib/schema/tagSchema';
import { statusUpdate } from './statusUpdate';
import { combinedTitleSplitRequired } from '$lib/helpers/combinedTitleSplit';
import { updatedTime } from './updatedTime';

export const tagCreateInsertionData = (data: CreateTagSchemaType, id: string) => {
	return {
		id,
		...statusUpdate(data.status),
		...updatedTime(),
		...combinedTitleSplitRequired(data)
	};
};