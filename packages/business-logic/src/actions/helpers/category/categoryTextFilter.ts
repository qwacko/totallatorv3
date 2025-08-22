import type { CategoryFilterSchemaWithoutPaginationType } from '@totallator/shared';

import { fileFilterArray } from '../file/fileTextFilter';
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

export const categoryFilterArray: TextFilterOptionsType<CategoryFilterSchemaWithoutPaginationType> =
	[
		...importTextFilterArray,
		...statusTextFilterArray,
		...statisticsTextFilterArray,
		...groupSingleTextFilterArray,
		...fileFilterArray,
		...noteFilterArray,
		...idTitleTextFilterArray
	];

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
