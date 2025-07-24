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
import { noteFilterArray } from '../note/noteTextFilter';
import { fileFilterArray } from '../file/fileTextFilter';

export const labelFilterArray = [
	...importTextFilterArray,
	...statusTextFilterArray,
	...statisticsTextFilterArray,
	...groupSingleTextFilterArray,
	...fileFilterArray,
	...noteFilterArray,
	...idTitleTextFilterArray
] satisfies TextFilterOptionsType<LabelFilterSchemaWithoutPaginationType>;

export const processLabelTextFilter = textFilterHandler<LabelFilterSchemaWithoutPaginationType>(
	labelFilterArray,
	(filter, currentFilter) => {
		addToArray(filter, 'titleArray', currentFilter);
	},
	(filter, currentFilter) => {
		addToArray(filter, 'excludeTitleArray', currentFilter);
	}
);

export const labelTextFilterKeys = labelFilterArray.map((f) => f.key).flat();
