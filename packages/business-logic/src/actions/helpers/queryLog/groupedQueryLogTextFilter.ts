import { noteTypeEnum } from '@totallator/shared';
import type { GroupedQueryLogFilterWithoutPaginationType } from '@totallator/shared';

import {
	addEnumToArray,
	addToArray,
	compareTextDate,
	textFilterHandler,
	type TextFilterOptionsType
} from '../misc/processTextFilter';

const filterArray = [
	{
		key: ['title:'],
		update: (filter, currentFilter) => {
			addEnumToArray(filter, 'titleArray', currentFilter, noteTypeEnum);
		}
	},
	{
		key: ['!title:'],
		update: (filter, currentFilter) => {
			addEnumToArray(filter, 'excludeTitleArray', currentFilter, noteTypeEnum);
		}
	},
	{
		key: ['!start:', 'start:'],
		update: (filter, currentFilter) => {
			compareTextDate(filter, 'start', currentFilter, 'min');
		}
	},
	{
		key: ['!end:', 'end:'],
		update: (filter, currentFilter) => {
			compareTextDate(filter, 'end', currentFilter, 'max');
		}
	}
] satisfies TextFilterOptionsType<GroupedQueryLogFilterWithoutPaginationType>;

export const processGroupedQueryLogTextFilter =
	textFilterHandler<GroupedQueryLogFilterWithoutPaginationType>(
		filterArray,
		(filter, currentFilter) => {
			addToArray(filter, 'titleArray', currentFilter);
		},
		(filter, currentFilter) => {
			addToArray(filter, 'excludeTitleArray', currentFilter);
		}
	);

export const groupedQueryLogTextFilterKeys = filterArray.map((f) => f.key).flat();
