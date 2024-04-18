import type { CategoryFilterSchemaWithoutPaginationType } from '$lib/schema/categorySchema';
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

const filterArray = [
	...importTextFilterArray,
	...statusTextFilterArray,
	...statisticsTextFilterArray,
	...groupSingleTextFilterArray,
	...fileFilterArray,
	...noteFilterArray,
	...idTitleTextFilterArray
] satisfies TextFilterOptionsType<CategoryFilterSchemaWithoutPaginationType>;

export const processCategoryTextFilter =
	textFilterHandler<CategoryFilterSchemaWithoutPaginationType>(
		filterArray,
		(filter, currentFilter) => {
			addToArray(filter, 'titleArray', currentFilter);
		},
		(filter, currentFilter) => {
			addToArray(filter, 'excludeTitleArray', currentFilter);
		}
	);

export const categoryTextFilterKeys = filterArray.map((f) => f.key).flat();
