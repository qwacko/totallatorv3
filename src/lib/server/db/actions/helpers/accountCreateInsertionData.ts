import type { CreateAccountSchemaType } from '$lib/schema/accountSchema';
import { statusUpdate } from './statusUpdate';
import { updatedTime } from './updatedTime';
import { combinedAccountTitleSplitRequired } from '$lib/helpers/combinedAccountTitleSplit';
import { logging } from '$lib/server/logging';

export const accountCreateInsertionData = (data: CreateAccountSchemaType, id: string) => {
	logging.info('Creating Account', data);
	if (data.type === 'asset' || data.type === 'liability') {
		logging.info('Creating Asset / Liability');
		return {
			id,
			...data,
			...statusUpdate(data.status),
			...updatedTime(),
			...combinedAccountTitleSplitRequired(data)
		};
	} else {
		logging.info('Creating income Expense', {
			id,
			...data,
			...statusUpdate(data.status),
			...updatedTime(),
			...combinedAccountTitleSplitRequired({ title: data.title, accountGroupCombined: '' }),
			startDate: null,
			endDate: null,
			isCash: false,
			isNetWorth: false
		});
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
