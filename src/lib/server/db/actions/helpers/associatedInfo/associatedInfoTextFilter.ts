import {
	addToArray,
	textFilterHandler,
	type TextFilterOptionsType
} from '../misc/processTextFilter';
import type { AssociatedInfoFilterSchemaType } from '$lib/schema/associatedInfoSchema';

const filterArray = [
	{
		key: 'id:',
		update: (filter, newFilter) => {
			addToArray(filter, 'idArray', newFilter);
		}
	},
	{
		key: '!id:',
		update: (filter, newFilter) => {
			addToArray(filter, 'excludeIdArray', newFilter);
		}
	}
] satisfies TextFilterOptionsType<AssociatedInfoFilterSchemaType>;

export const processAssociatedInfoTextFilter = textFilterHandler<AssociatedInfoFilterSchemaType>(
	filterArray,
	(filter, currentFilter) => {
		addToArray(filter, 'titleArray', currentFilter);
	},
	(filter, currentFilter) => {
		addToArray(filter, 'excludeTitleArray', currentFilter);
	}
);

export const associatedInfoTextFilterKeys = filterArray.map((f) => f.key).flat();
