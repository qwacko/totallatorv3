import type { CreateAccountSchemaType } from '$lib/schema/accountSchema';
import { statusUpdate } from './statusUpdate';
import { updatedTime } from './updatedTime';
import { combinedAccountTitleSplitRequired } from '$lib/helpers/combinedAccountTitleSplit';

export const accountCreateInsertionData = (data: CreateAccountSchemaType, id: string) => {
	if (data.type === 'asset' || data.type === 'liability') {
		return {
			id,
			...data,
			...statusUpdate(data.status),
			...updatedTime(),
			...combinedAccountTitleSplitRequired(data)
		};
	} else {
		return {
			id,
			...data,
			...statusUpdate(data.status),
			...updatedTime(),
			...combinedAccountTitleSplitRequired({ title: data.title, accountGroupCombined: '' }),
			startDate: null,
			endDate: null,
			isCash: false,
			isNetWorth: false
		};
	}
};
