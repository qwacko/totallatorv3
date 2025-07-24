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
import { noteFilterArray } from '../note/noteTextFilter';
import { fileFilterArray } from '../file/fileTextFilter';

export const budgetFilterArray = [
	...importTextFilterArray,
	...statusTextFilterArray,
	...statisticsTextFilterArray,
	...groupSingleTextFilterArray,
	...fileFilterArray,
	...noteFilterArray,
	...idTitleTextFilterArray
] satisfies TextFilterOptionsType<BudgetFilterSchemaWithoutPaginationType>;

export const processBudgetTextFilter = textFilterHandler<BudgetFilterSchemaWithoutPaginationType>(
	budgetFilterArray,
	(filter, currentFilter) => {
		addToArray(filter, 'titleArray', currentFilter);
	},
	(filter, currentFilter) => {
		addToArray(filter, 'excludeTitleArray', currentFilter);
	}
);

export const budgetTextFilterKeys = budgetFilterArray.map((f) => f.key).flat();
