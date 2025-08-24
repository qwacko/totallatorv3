import type { TagFilterSchemaWithoutPaginationType } from '@totallator/shared';

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

export const tagFilterArray: TextFilterOptionsType<TagFilterSchemaWithoutPaginationType> = [
	...importTextFilterArray,
	...statusTextFilterArray,
	...statisticsTextFilterArray,
	...groupSingleTextFilterArray,
	...fileFilterArray,
	...noteFilterArray,
	...idTitleTextFilterArray
];

export const processTagTextFilter = textFilterHandler<TagFilterSchemaWithoutPaginationType>(
	tagFilterArray,
	(filter, currentFilter) => {
		addToArray(filter, 'titleArray', currentFilter);
	},
	(filter, currentFilter) => {
		addToArray(filter, 'excludeTitleArray', currentFilter);
	}
);

export const tagTextFilterKeys = tagFilterArray.map((f) => f.key).flat();
