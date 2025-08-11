import { noteTypeEnum } from '@totallator/shared';
import type { NoteFilterSchemaWithoutPaginationType } from '@totallator/shared';
import {
	addEnumToArray,
	addToArray,
	textFilterHandler,
	type TextFilterOptionsType
} from '../misc/processTextFilter';

const filterArray: TextFilterOptionsType<NoteFilterSchemaWithoutPaginationType> = [
	{
		key: ['type:'],
		update: (filter, currentFilter) => {
			addEnumToArray(filter, 'typeArray', currentFilter, noteTypeEnum);
		}
	},
	{
		key: ['!type:'],
		update: (filter, currentFilter) => {
			addEnumToArray(filter, 'excludeTypeArray', currentFilter, noteTypeEnum);
		}
	}
];

export const processNoteTextFilter = textFilterHandler<NoteFilterSchemaWithoutPaginationType>(
	filterArray,
	(filter, currentFilter) => {
		addToArray(filter, 'noteArray', currentFilter);
	},
	(filter, currentFilter) => {
		addToArray(filter, 'excludeNoteArray', currentFilter);
	}
);

export const noteTextFilterKeys = filterArray.map((f) => f.key).flat();

export const noteFilterArray: TextFilterOptionsType<{
	textFilter?: string;
	note?: boolean;
	reminder?: boolean;
}> = [
	{
		key: ['note:', 'notes:'],
		update: (filter) => {
			filter.note = true;
		}
	},
	{
		key: ['!note:', '!notes:'],
		update: (filter) => {
			filter.note = false;
		}
	},
	{
		key: ['reminder:', 'reminders:'],
		update: (filter) => {
			filter.reminder = true;
		}
	},
	{
		key: ['!reminder:', '!reminders:'],
		update: (filter) => {
			filter.reminder = false;
		}
	}
];
