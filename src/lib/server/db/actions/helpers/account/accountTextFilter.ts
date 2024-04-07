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
					if (filter.type === undefined) {
						filter.type = [];
					}
					filter.type.push(accountType);
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
					if (filter.excludeType === undefined) {
						filter.excludeType = [];
					}
					filter.excludeType.push(accountType);
				}
			}
		}
	},
	{
		key: ['combinedTitle:', 'combined:'],
		update: (filter, newFilter) => {
			addToArray(filter, 'accountTitleCombinedArray', newFilter);
		}
	},
	{
		key: ['!combinedTitle:', '!combined:'],
		update: (filter, newFilter) => {
			addToArray(filter, 'excludeAccountTitleCombinedArray', newFilter);
		}
	},
	{
		key: ['accountgroup:', 'group:'],
		update: (filter, newFilter) => {
			addToArray(filter, 'accountGroupCombinedArray', newFilter);
		}
	},
	{
		key: ['!accountgroup:', '!group:'],
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
		key: ['startafter:', '!startbefore:'],
		update: (filter, newFilter) => {
			compareTextDate(filter, 'startDateAfter', newFilter, 'max');
		}
	},
	{
		key: ['startbefore:', '!startafter:'],
		update: (filter, newFilter) => {
			compareTextDate(filter, 'startDateBefore', newFilter, 'min');
		}
	},
	{
		key: ['endafter:', '!endbefore:'],
		update: (filter, newFilter) => {
			compareTextDate(filter, 'startDateAfter', newFilter, 'max');
		}
	},
	{
		key: ['endbefore:', '!endafter:'],
		update: (filter, newFilter) => {
			compareTextDate(filter, 'startDateBefore', newFilter, 'min');
		}
	},
	{
		key: ['mincount:', 'countmin:'],
		update: (filter, newFilter) => {
			compareTextNumber(filter, 'countMin', newFilter, 'min');
		}
	},
	{
		key: ['maxcount:', 'countmax:'],
		update: (filter, newFilter) => {
			compareTextNumber(filter, 'countMax', newFilter, 'max');
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
		key: '!',
		update: (filter, newFilter) => {
			addToArray(filter, 'excludeTitlearray', newFilter);
		}
	}
] satisfies TextFilterOptionsType<AccountFilterSchemaWithoutPaginationType>;

export const processJournalTextFilter = textFilterHandler(filterArray, (filter, currentFilter) => {
	addToArray(filter, 'titleArray', currentFilter);
});

export const accountTextFilterKeys = filterArray.map((f) => f.key).flat();
