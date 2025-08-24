import type { LabelFilterSchemaWithoutPaginationType } from '@totallator/shared';

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

export const labelFilterArray: TextFilterOptionsType<LabelFilterSchemaWithoutPaginationType> = [
	...importTextFilterArray,
	...statusTextFilterArray,
	...statisticsTextFilterArray,
	...groupSingleTextFilterArray,
	...fileFilterArray,
	...noteFilterArray,
	...idTitleTextFilterArray
];

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
