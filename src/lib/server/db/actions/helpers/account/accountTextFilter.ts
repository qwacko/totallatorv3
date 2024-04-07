import type { AccountFilterSchemaWithoutPaginationType } from '$lib/schema/accountSchema';
import { accountTypeEnum, type AccountTypeEnumType } from '$lib/schema/accountTypeSchema';
import {
	addToArray,
	compareTextDate,
	compareTextNumber,
	textFilterHandler,
	type TextFilterOptionsType
} from '../misc/processTextFilter';

const filterArray = [
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
	},
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
	},
	{
		key: ['networth:', 'nw'],
		update: (filter) => {
			filter.isNetWorth = true;
		}
	},
	{
		key: ['!networth:', '!nw:'],
		update: (filter) => {
			filter.isNetWorth = false;
		}
	},
	{
		key: 'cash:',
		update: (filter) => {
			filter.isCash = true;
		}
	},
	{
		key: '!cash:',
		update: (filter) => {
			filter.isCash = false;
		}
	},
	{
		key: ['!accountType', '!type:'],
		update: (filter, newFilter) => {
			if (newFilter.length === 0) return;

			const splitFilter = newFilter.trim().replace('|', ',').split(',');

			for (const currentFilter of splitFilter) {
				const accountType = currentFilter.trim().toLocaleLowerCase() as AccountTypeEnumType;

				if (accountTypeEnum.includes(accountType)) {
					if (filter.excludeType === undefined) {
						filter.excludeType = [];
					}
					filter.excludeType.push(accountType);
				}
			}
		}
	},
	{
		key: ['accountType:', 'type:'],
		update: (filter, newFilter) => {
			if (newFilter.length === 0) return;

			const splitFilter = newFilter.trim().replace('|', ',').split(',');

			for (const currentFilter of splitFilter) {
				const accountType = currentFilter.trim().toLocaleLowerCase() as AccountTypeEnumType;

				if (accountTypeEnum.includes(accountType)) {
					if (filter.type === undefined) {
						filter.type = [];
					}
					filter.type.push(accountType);
				}
			}
		}
	},
	{
		key: ['combinedTitle:', 'combined:', 'titlecombined:'],
		update: (filter, newFilter) => {
			addToArray(filter, 'accountTitleCombinedArray', newFilter);
		}
	},
	{
		key: ['!combinedTitle:', '!combined:', '!titlecombined:'],
		update: (filter, newFilter) => {
			addToArray(filter, 'excludeAccountTitleCombinedArray', newFilter);
		}
	},
	{
		key: ['accountgroup:', 'group:', 'groupcombined:', 'combinedgroup:'],
		update: (filter, newFilter) => {
			addToArray(filter, 'accountGroupCombinedArray', newFilter);
		}
	},
	{
		key: ['!accountgroup:', '!group:', '!groupcombined:', '!combinedgroup:'],
		update: (filter, newFilter) => {
			addToArray(filter, 'excludeAccountGroupCombinedArray', newFilter);
		}
	},
	{
		key: ['accountgroup1:', 'group1:'],
		update: (filter, newFilter) => {
			addToArray(filter, 'accountGroupArray', newFilter);
		}
	},
	{
		key: ['!accountgroup1:', '!group1:'],
		update: (filter, newFilter) => {
			addToArray(filter, 'excludeAccountGroupArray', newFilter);
		}
	},
	{
		key: ['accountgroup2:', 'group2:'],
		update: (filter, newFilter) => {
			addToArray(filter, 'accountGroup2Array', newFilter);
		}
	},
	{
		key: ['!accountgroup2:', '!group2:'],
		update: (filter, newFilter) => {
			addToArray(filter, 'excludeAccountGroup2Array', newFilter);
		}
	},
	{
		key: ['accountgroup3:', 'group3:'],
		update: (filter, newFilter) => {
			addToArray(filter, 'accountGroup3Array', newFilter);
		}
	},
	{
		key: ['!accountgroup3:', '!group3:'],
		update: (filter, newFilter) => {
			addToArray(filter, 'excludeAccountGroup3Array', newFilter);
		}
	},
	{
		key: ['startafter:', '!startafter:'],
		update: (filter, newFilter) => {
			compareTextDate(filter, 'startDateAfter', newFilter, 'max');
		}
	},
	{
		key: ['startbefore:', '!startbefore:'],
		update: (filter, newFilter) => {
			compareTextDate(filter, 'startDateBefore', newFilter, 'min');
		}
	},
	{
		key: ['endafter:', '!endafter:'],
		update: (filter, newFilter) => {
			compareTextDate(filter, 'endDateAfter', newFilter, 'max');
		}
	},
	{
		key: ['endbefore:', '!endbefore:'],
		update: (filter, newFilter) => {
			compareTextDate(filter, 'endDateBefore', newFilter, 'min');
		}
	},
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
	},
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
	},
	{
		key: '!',
		update: (filter, newFilter) => {
			addToArray(filter, 'excludeTitleArray', newFilter);
		}
	}
] satisfies TextFilterOptionsType<AccountFilterSchemaWithoutPaginationType>;

export const processAccountTextFilter = textFilterHandler(filterArray, (filter, currentFilter) => {
	addToArray(filter, 'titleArray', currentFilter);
});

export const accountTextFilterKeys = filterArray.map((f) => f.key).flat();
