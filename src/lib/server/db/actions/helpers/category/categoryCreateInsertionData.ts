import type { CreateCategorySchemaType } from '$lib/schema/categorySchema';
import { statusUpdate } from '../statusUpdate';
import { combinedTitleSplitRequired } from '$lib/helpers/combinedTitleSplit';
import { updatedTime } from '../updatedTime';

export const categoryCreateInsertionData = (data: CreateCategorySchemaType, id: string) => {
	return {
		id,
		importId: data.importId,
		importDetailId: data.importDetailId,
		...statusUpdate(data.status),
		...updatedTime(),
		...combinedTitleSplitRequired(data)
	};
};
