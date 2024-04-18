import { fileReasonEnum } from '$lib/schema/enum/fileReasonEnum';
import { fileTypeEnum } from '$lib/schema/enum/fileTypeEnum';
import type { FileFilterSchemaWithoutPaginationType } from '$lib/schema/fileSchema';
import {
	addEnumToArray,
	addToArray,
	compareTextNumber,
	textFilterHandler,
	type TextFilterOptionsType
} from '../misc/processTextFilter';

const filterArray = [
	{
		key: ['type:'],
		update: (filter, currentFilter) => {
			addEnumToArray(filter, 'typeArray', currentFilter, fileTypeEnum);
		}
	},
	{
		key: ['!type:'],
		update: (filter, currentFilter) => {
			addEnumToArray(filter, 'excludeTypeArray', currentFilter, fileTypeEnum);
		}
	},
	{
		key: ['reason:'],
		update: (filter, currentFilter) => {
			addEnumToArray(filter, 'reasonArray', currentFilter, fileReasonEnum);
		}
	},
	{
		key: ['!reason:'],
		update: (filter, currentFilter) => {
			addEnumToArray(filter, 'excludeReasonArray', currentFilter, fileReasonEnum);
		}
	},
	{
		key: ['filename:', 'file:'],
		update: (filter, currentFilter) => {
			addToArray(filter, 'filenameArray', currentFilter);
		}
	},
	{
		key: ['!filename:', '!file:'],
		update: (filter, currentFilter) => {
			addToArray(filter, 'excludeFilenameArray', currentFilter);
		}
	},
	{
		key: ['maxSize:', '!maxSize:', 'max:', '!max:'],
		update: (filter, currentFilter) => {
			compareTextNumber(filter, 'maxSize', currentFilter, 'max');
		}
	},
	{
		key: ['minSize:', '!minSize:', 'min:', '!min:'],
		update: (filter, currentFilter) => {
			compareTextNumber(filter, 'minSize', currentFilter, 'min');
		}
	},
	{
		key: ['linked:'],
		update: (filter) => {
			filter.linked = true;
		}
	},
	{
		key: ['!linked:'],
		update: (filter) => {
			filter.linked = false;
		}
	},
	{
		key: ['exists:'],
		update: (filter) => {
			filter.exists = true;
		}
	},
	{
		key: ['!exists:'],
		update: (filter) => {
			filter.exists = false;
		}
	},
	{
		key: ['thumbnail:'],
		update: (filter) => {
			filter.thumbnail = true;
		}
	},
	{
		key: ['!thumbnail:'],
		update: (filter) => {
			filter.thumbnail = false;
		}
	}
] satisfies TextFilterOptionsType<FileFilterSchemaWithoutPaginationType>;

export const processNoteTextFilter = textFilterHandler<FileFilterSchemaWithoutPaginationType>(
	filterArray,
	(filter, currentFilter) => {
		addToArray(filter, 'titleArray', currentFilter);
	},
	(filter, currentFilter) => {
		addToArray(filter, 'excludeTitleArray', currentFilter);
	}
);

export const noteTextFilterKeys = filterArray.map((f) => f.key).flat();

export const fileFilterArray = [
	{
		key: ['file:', 'files:'],
		update: (filter) => {
			filter.file = true;
		}
	},
	{
		key: ['!file:', '!files:'],
		update: (filter) => {
			filter.file = false;
		}
	}
] satisfies TextFilterOptionsType<{
	textFilter?: string;
	file?: boolean;
}>;
