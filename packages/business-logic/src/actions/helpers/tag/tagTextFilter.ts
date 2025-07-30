import type { TagFilterSchemaWithoutPaginationType } from '@totallator/shared';
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

export const tagFilterArray = [
	...importTextFilterArray,
	...statusTextFilterArray,
	...statisticsTextFilterArray,
	...groupSingleTextFilterArray,
	...fileFilterArray,
	...noteFilterArray,
	...idTitleTextFilterArray
] satisfies TextFilterOptionsType<TagFilterSchemaWithoutPaginationType>;

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
