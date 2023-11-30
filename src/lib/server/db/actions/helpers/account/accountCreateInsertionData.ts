import type { CreateAccountSchemaType } from '$lib/schema/accountSchema';
import { statusUpdate } from '../misc/statusUpdate';
import { updatedTime } from '../misc/updatedTime';
import { combinedAccountTitleSplitRequired } from '$lib/helpers/combinedAccountTitleSplit';

export const accountCreateInsertionData = (data: CreateAccountSchemaType, id: string) => {
	if (data.startDate) {
		//Check start date is 10 characters and an actual date
		if (data.startDate.length !== 10) {
			throw new Error('Start date must be 10 characters');
		}

		if (!Date.parse(data.startDate)) {
			throw new Error('Start date is not a valid date');
		}
	}

	if (data.endDate) {
		//Check end date is 10 characters and an actual date
		if (data.endDate.length !== 10) {
			throw new Error('End date must be 10 characters');
		}

		if (!Date.parse(data.endDate)) {
			throw new Error('End date is not a valid date');
		}
	}

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
