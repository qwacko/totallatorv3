import type { TagFilterSchemaWithoutPaginationType } from '$lib/schema/tagSchema';
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
] satisfies TextFilterOptionsType<TagFilterSchemaWithoutPaginationType>;

export const processTagTextFilter = textFilterHandler<TagFilterSchemaWithoutPaginationType>(
	filterArray,
	(filter, currentFilter) => {
		addToArray(filter, 'titleArray', currentFilter);
	},
	(filter, currentFilter) => {
		addToArray(filter, 'excludeTitleArray', currentFilter);
	}
);

export const tagTextFilterKeys = filterArray.map((f) => f.key).flat();
