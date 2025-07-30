import type { CategoryFilterSchemaWithoutPaginationType } from '@totallator/shared';
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

export const categoryFilterArray = [
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
		categoryFilterArray,
		(filter, currentFilter) => {
			addToArray(filter, 'titleArray', currentFilter);
		},
		(filter, currentFilter) => {
			addToArray(filter, 'excludeTitleArray', currentFilter);
		}
	);

export const categoryTextFilterKeys = categoryFilterArray.map((f) => f.key).flat();
