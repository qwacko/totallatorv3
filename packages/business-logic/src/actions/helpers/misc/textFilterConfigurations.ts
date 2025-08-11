import type { AccountFilterSchemaWithoutPaginationType } from '@totallator/shared';
import type { BillFilterSchemaWithoutPaginationType } from '@totallator/shared';
import type { BudgetFilterSchemaWithoutPaginationType } from '@totallator/shared';
import type { CategoryFilterSchemaWithoutPaginationType } from '@totallator/shared';
import type { LabelFilterSchemaWithoutPaginationType } from '@totallator/shared';
import type { TagFilterSchemaWithoutPaginationType } from '@totallator/shared';
import {
	addToArray,
	compareTextDate,
	compareTextNumber,
	type TextFilterOptionsType
} from './processTextFilter';

type TextFilterSchemaType = TextFilterOptionsType<
	| AccountFilterSchemaWithoutPaginationType
	| TagFilterSchemaWithoutPaginationType
	| BillFilterSchemaWithoutPaginationType
	| BudgetFilterSchemaWithoutPaginationType
	| CategoryFilterSchemaWithoutPaginationType
	| LabelFilterSchemaWithoutPaginationType
>;

type TextFilterWithGroupSingleSchemaType = TextFilterOptionsType<
	TagFilterSchemaWithoutPaginationType | CategoryFilterSchemaWithoutPaginationType
>;

export const groupSingleTextFilterArray: TextFilterWithGroupSingleSchemaType = [
	{
		key: ['group:'],
		update: (filter, newFilter) => {
			addToArray(filter, 'groupArray', newFilter);
		}
	},
	{
		key: ['!group:'],
		update: (filter, newFilter) => {
			addToArray(filter, 'excludeGroupArray', newFilter);
		}
	},
	{
		key: ['single:'],
		update: (filter, newFilter) => {
			addToArray(filter, 'singleArray', newFilter);
		}
	},
	{
		key: ['!single:'],
		update: (filter, newFilter) => {
			addToArray(filter, 'excludeSingleArray', newFilter);
		}
	}
];

export const importTextFilterArray = [
	{
		key: ['importDetailId:', 'importDetail:'],
		update: (filter, newFilter) => {
			addToArray(filter, 'importDetailIdArray', newFilter);
		}
	},
	{
		key: ['!importDetailId:', '!importDetail:'],
		update: (filter, newFilter) => {
			addToArray(filter, 'excludeImportDetailIdArray', newFilter);
		}
	},
	{
		key: ['importId:', 'import:'],
		update: (filter, newFilter) => {
			addToArray(filter, 'importIdArray', newFilter);
		}
	},
	{
		key: ['!importId:', '!import:'],
		update: (filter, newFilter) => {
			addToArray(filter, 'excludeImportIdArray', newFilter);
		}
	}
] satisfies TextFilterSchemaType;

export const statusTextFilterArray = [
	{
		key: ['status:'],
		update: (filter, newFilter) => {
			if (!filter.statusArray) {
				filter.statusArray = [];
			}
			if (newFilter === 'active') {
				filter.statusArray.push('active');
			}
			if (newFilter === 'disabled') {
				filter.statusArray.push('disabled');
			}
		}
	},
	{
		key: ['!status:'],
		update: (filter, newFilter) => {
			if (!filter.excludeStatusArray) {
				filter.excludeStatusArray = [];
			}
			if (newFilter === 'active') {
				filter.excludeStatusArray.push('active');
			}
			if (newFilter === 'disabled') {
				filter.excludeStatusArray.push('disabled');
			}
		}
	},
	{
		key: ['disabled:'],
		update: (filter) => {
			filter.disabled = true;
		}
	},
	{
		key: ['!disabled:'],
		update: (filter) => {
			filter.disabled = false;
		}
	},
	{
		key: ['allowupdate:'],
		update: (filter) => {
			filter.allowUpdate = true;
		}
	},
	{
		key: ['!allowupdate'],
		update: (filter) => {
			filter.allowUpdate = false;
		}
	},
	{
		key: ['active:'],
		update: (filter) => {
			filter.active = true;
		}
	},
	{
		key: ['!active:'],
		update: (filter) => {
			filter.active = false;
		}
	}
] satisfies TextFilterSchemaType;

export const idTitleTextFilterArray = [
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
	},
	{
		key: ['title:', 'description:'],
		update: (filter, newFilter) => {
			addToArray(filter, 'titleArray', newFilter);
		}
	},
	{
		key: ['!title:', '!description:'],
		update: (filter, newFilter) => {
			addToArray(filter, 'excludeTitleArray', newFilter);
		}
	}
] satisfies TextFilterSchemaType;

export const statisticsTextFilterArray = [
	{
		key: ['min:', 'mintotal:', '!min:', '!mintotal:', 'totalmin:', '!totalmin:'],
		update: (filter, newFilter) => {
			compareTextNumber(filter, 'totalMin', newFilter, 'min');
		}
	},
	{
		key: ['max:', 'maxtotal:', '!max:', '!maxtotal:', 'totalmax:', '!totalmax:'],
		update: (filter, newFilter) => {
			compareTextNumber(filter, 'totalMax', newFilter, 'max');
		}
	},
	{
		key: ['mincount:', 'countmin:', '!mincount:', '!countmin:'],
		update: (filter, newFilter) => {
			compareTextNumber(filter, 'countMin', newFilter, 'min');
		}
	},
	{
		key: ['maxcount:', 'countmax:', '!maxcount:', '!countmax:'],
		update: (filter, newFilter) => {
			compareTextNumber(filter, 'countMax', newFilter, 'max');
		}
	},
	{
		key: ['minlast:', 'lastmin:', '!minlast:', '!lastmin:'],
		update: (filter, newFilter) => {
			compareTextDate(filter, 'lastDateMin', newFilter, 'min');
		}
	},
	{
		key: ['maxlast:', 'lastmax:', '!maxlast:', '!lastmax:'],
		update: (filter, newFilter) => {
			compareTextDate(filter, 'lastDateMax', newFilter, 'max');
		}
	},
	{
		key: ['minfirst:', 'firstmin:', '!minfirst:', '!firstmin:'],
		update: (filter, newFilter) => {
			compareTextDate(filter, 'firstDateMin', newFilter, 'min');
		}
	},
	{
		key: ['maxfirst:', 'firstmax:', '!maxfirst:', '!firstmax:'],
		update: (filter, newFilter) => {
			compareTextDate(filter, 'firstDateMax', newFilter, 'max');
		}
	}
] satisfies TextFilterSchemaType;
