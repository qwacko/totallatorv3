import type { LabelFilterSchemaWithoutPaginationType } from '$lib/schema/labelSchema';
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
] satisfies TextFilterOptionsType<LabelFilterSchemaWithoutPaginationType>;

export const processLabelTextFilter = textFilterHandler<LabelFilterSchemaWithoutPaginationType>(
	filterArray,
	(filter, currentFilter) => {
		addToArray(filter, 'titleArray', currentFilter);
	},
	(filter, currentFilter) => {
		addToArray(filter, 'excludeTitleArray', currentFilter);
	}
);

export const labelTextFilterKeys = filterArray.map((f) => f.key).flat();
