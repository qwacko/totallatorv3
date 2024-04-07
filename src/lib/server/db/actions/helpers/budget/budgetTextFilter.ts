import type { BudgetFilterSchemaWithoutPaginationType } from '$lib/schema/budgetSchema';
import {
	addToArray,
	textFilterHandler,
	type TextFilterOptionsType
} from '../misc/processTextFilter';
import {
	groupSingleTextFilterArray,
	idTitleTextFilterArray,
	importTextFilterArray,
	statisticsTextFilterArray,
	statusTextFilterArray
} from '../misc/textFilterConfigurations';

const filterArray = [
	...importTextFilterArray,
	...statusTextFilterArray,
	...statisticsTextFilterArray,
	...groupSingleTextFilterArray,
	...idTitleTextFilterArray
] satisfies TextFilterOptionsType<BudgetFilterSchemaWithoutPaginationType>;

export const processBudgetTextFilter = textFilterHandler<BudgetFilterSchemaWithoutPaginationType>(
	filterArray,
	(filter, currentFilter) => {
		addToArray(filter, 'titleArray', currentFilter);
	},
	(filter, currentFilter) => {
		addToArray(filter, 'excludeTitleArray', currentFilter);
	}
);

export const budgetTextFilterKeys = filterArray.map((f) => f.key).flat();
