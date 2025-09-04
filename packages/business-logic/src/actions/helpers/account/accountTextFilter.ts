import type { AccountFilterSchemaWithoutPaginationType } from '@totallator/shared';
import { accountTypeEnum, type AccountTypeEnumType } from '@totallator/shared';

import { fileFilterArray } from '../file/fileTextFilter';
import {
	addToArray,
	compareTextDate,
	textFilterHandler,
	type TextFilterOptionsType
} from '../misc/processTextFilter';
import {
	idTitleTextFilterArray,
	importTextFilterArray,
	statisticsTextFilterArray,
	statusTextFilterArray
} from '../misc/textFilterConfigurations';
import { noteFilterArray } from '../note/noteTextFilter';

export const accountFilterArray: TextFilterOptionsType<AccountFilterSchemaWithoutPaginationType> = [
	...importTextFilterArray,
	...statusTextFilterArray,
	...statisticsTextFilterArray,
	{
		key: ['networth:', 'nw:'],
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
		key: 'catchall:',
		update: (filter) => {
			filter.isCatchall = true;
		}
	},
	{
		key: '!catchall:',
		update: (filter) => {
			filter.isCatchall = false;
		}
	},
	{
		key: ['!accountType:', '!type:'],
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
	...fileFilterArray,
	...noteFilterArray,
	...idTitleTextFilterArray
];

export const processAccountTextFilter = textFilterHandler(
	accountFilterArray,
	(filter, currentFilter) => {
		addToArray(filter, 'titleArray', currentFilter);
	},
	(filter, currentFilter) => {
		addToArray(filter, 'excludeTitleArray', currentFilter);
	}
);

export const accountTextFilterKeys = accountFilterArray.map((f) => f.key).flat();
