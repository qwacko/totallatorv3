import type { CreateTagSchemaType } from '@totallator/shared';

import { combinedTitleSplitRequired } from '@/helpers/combinedTitleSplit';

import { statusUpdate } from '../misc/statusUpdate';
import { updatedTime } from '../misc/updatedTime';

export const tagCreateInsertionData = (data: CreateTagSchemaType, id: string) => {
	return {
		id,
		importId: data.importId,
		importDetailId: data.importDetailId,
		...statusUpdate(data.status),
		...updatedTime(),
		...combinedTitleSplitRequired(data)
	};
};
