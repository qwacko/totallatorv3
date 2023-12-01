import { category, bill, budget, tag, label, account } from '../../../schema';
import { SQL, inArray } from 'drizzle-orm';
import { arrayToText } from './arrayToText';
import { importIdsToTitles } from '../import/importIdsToTitles';

type FilterCoreType = { importIdArray?: string[]; importDetailIdArray?: string[] };

export const importFilterToQuery = (
	where: SQL<unknown>[],
	filter: FilterCoreType,
	type: 'bill' | 'budget' | 'category' | 'tag' | 'label' | 'account'
) => {
	const restFilter = filter;

	const usedTable =
		type === 'category'
			? category
			: type === 'bill'
			? bill
			: type === 'budget'
			? budget
			: type === 'tag'
			? tag
			: type === 'label'
			? label
			: account;

	if (restFilter.importIdArray && restFilter.importIdArray.length > 0)
		where.push(inArray(usedTable.importId, restFilter.importIdArray));
	if (restFilter.importDetailIdArray && restFilter.importDetailIdArray.length > 0)
		where.push(inArray(usedTable.importDetailId, restFilter.importDetailIdArray));

	return where;
};

export const importFilterToText = async (stringArray: string[], filter: FilterCoreType) => {
	const restFilter = filter;

	if (restFilter.importIdArray && restFilter.importIdArray.length > 0)
		stringArray.push(
			await arrayToText({
				data: restFilter.importIdArray,
				singularName: 'Import',
				inputToText: importIdsToTitles
			})
		);
	if (restFilter.importDetailIdArray && restFilter.importDetailIdArray.length > 0)
		stringArray.push(
			await arrayToText({
				data: restFilter.importDetailIdArray,
				singularName: 'Import Detail ID'
			})
		);
	return stringArray;
};
