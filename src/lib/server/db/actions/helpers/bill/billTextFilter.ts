import type { BillFilterSchemaWithoutPaginationType } from '$lib/schema/billSchema';
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
] satisfies TextFilterOptionsType<BillFilterSchemaWithoutPaginationType>;

export const processBillTextFilter = textFilterHandler<BillFilterSchemaWithoutPaginationType>(
	filterArray,
	(filter, currentFilter) => {
		addToArray(filter, 'titleArray', currentFilter);
	},
	(filter, currentFilter) => {
		addToArray(filter, 'excludeTitleArray', currentFilter);
	}
);

export const billTextFilterKeys = filterArray.map((f) => f.key).flat();
