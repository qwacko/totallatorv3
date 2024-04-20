import type { QueryLogFilterSchemaWithoutPaginationType } from '$lib/schema/queryLogSchema';

import {
	addToArray,
	compareTextDate,
	compareTextNumber,
	textFilterHandler,
	type TextFilterOptionsType
} from '../misc/processTextFilter';

const filterArray = [
	{
		key: ['maxDuration:', '!maxDuration', 'max:', '!max:'],
		update: (filter, currentFilter) => {
			compareTextNumber(filter, 'maxDuration', currentFilter, 'min');
		}
	},
	{
		key: ['minDuration:', '!minDuration', 'min:', '!min:'],
		update: (filter, currentFilter) => {
			compareTextNumber(filter, 'minDuration', currentFilter, 'max');
		}
	},
	{
		key: ['last:', '!last:', 'lastMinutes:', '!lastMinutes:'],
		update: (filter, currentFilter) => {
			compareTextNumber(filter, 'lastMinutes', currentFilter, 'max');
		}
	},
	{
		key: ['title:'],
		update: (filter, currentFilter) => {
			addToArray(filter, 'titleArray', currentFilter);
		}
	},
	{
		key: ['!title:'],
		update: (filter, currentFilter) => {
			addToArray(filter, 'excludeTitleArray', currentFilter);
		}
	},
	{
		key: ['query:'],
		update: (filter, currentFilter) => {
			addToArray(filter, 'queryArray', currentFilter);
		}
	},
	{
		key: ['!query:'],
		update: (filter, currentFilter) => {
			addToArray(filter, 'excludeQueryArray', currentFilter);
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
] satisfies TextFilterOptionsType<QueryLogFilterSchemaWithoutPaginationType>;

export const processQueryLogTextFilter =
	textFilterHandler<QueryLogFilterSchemaWithoutPaginationType>(
		filterArray,
		(filter, currentFilter) => {
			addToArray(filter, 'titleArray', currentFilter);
		},
		(filter, currentFilter) => {
			addToArray(filter, 'excludeTitleArray', currentFilter);
		}
	);

export const queryLogTextFilterKeys = filterArray.map((f) => f.key).flat();
