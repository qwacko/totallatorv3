import type { BillFilterSchemaWithoutPaginationType } from '@totallator/shared';

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

export const billFilterArray: TextFilterOptionsType<BillFilterSchemaWithoutPaginationType> = [
	...importTextFilterArray,
	...statusTextFilterArray,
	...statisticsTextFilterArray,
	...groupSingleTextFilterArray,
	...fileFilterArray,
	...noteFilterArray,
	...idTitleTextFilterArray
];

export const processBillTextFilter = textFilterHandler<BillFilterSchemaWithoutPaginationType>(
	billFilterArray,
	(filter, currentFilter) => {
		addToArray(filter, 'titleArray', currentFilter);
	},
	(filter, currentFilter) => {
		addToArray(filter, 'excludeTitleArray', currentFilter);
	}
);

export const billTextFilterKeys = billFilterArray.map((f) => f.key).flat();
