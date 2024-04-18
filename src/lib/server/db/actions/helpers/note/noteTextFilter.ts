import { noteTypeEnum } from '$lib/schema/enum/noteTypeEnum';
import type { NoteFilterSchemaWithoutPaginationType } from '$lib/schema/noteSchema';
import {
	addEnumToArray,
	addToArray,
	textFilterHandler,
	type TextFilterOptionsType
} from '../misc/processTextFilter';

const filterArray = [
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
] satisfies TextFilterOptionsType<NoteFilterSchemaWithoutPaginationType>;

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

export const noteFilterArray = [
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
] satisfies TextFilterOptionsType<{
	textFilter?: string;
	note?: boolean;
	reminder?: boolean;
}>;
