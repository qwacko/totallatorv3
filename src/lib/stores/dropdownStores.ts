import { urlGenerator } from '$lib/routes';
import type { TagDropdownType } from '$lib/server/db/actions/tagActions';
import type { CategoryDropdownType } from '$lib/server/db/actions/categoryActions';
import type { BillDropdownType } from '$lib/server/db/actions/billActions';
import type { AccountDropdownType } from '$lib/server/db/actions/accountActions';
import type { ImportMappingDropdownType } from '$lib/server/db/actions/importMappingActions';
import type { BudgetDropdownType } from '$lib/server/db/actions/budgetActions';
import type { LabelDropdownType } from '$lib/server/db/actions/labelActions';
import { asyncDerived } from '@square/svelte-store';
import SuperJSON from 'superjson';
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const getDropdownData = <T extends Record<string, any>[]>({
	url,
	prefix
}: {
	url: string;
	prefix: string;
}) => {
	return async (newData: number[]): Promise<T> => {
		if (!browser) {
			const returnData = [] as unknown as T;
			return returnData;
		}

		const dropdownDataAddress = `${prefix}DropdownData`;
		const dropdownTimeAddress = `${prefix}DropdownTime`;

		const currentTime = newData[0];
		const storedDropdownTime = window.localStorage.getItem(dropdownTimeAddress);
		const storedDropdownData = window.localStorage.getItem(dropdownDataAddress);
		const newTime =
			storedDropdownTime === null ||
			storedDropdownData === null ||
			currentTime > parseInt(storedDropdownTime);

		if (!newTime) {
			const dropdownData = SuperJSON.parse(storedDropdownData) as T;
			return dropdownData;
		}

		console.log(`Updating ${prefix} dropdown data...`);

		const data = await fetch(url);
		const dropdownText = await data.text();
		const dropdownData = SuperJSON.parse(dropdownText) as T;

		window.localStorage.setItem(dropdownTimeAddress, currentTime.toString());
		window.localStorage.setItem(dropdownDataAddress, dropdownText);

		return dropdownData;
	};
};

// Tag Dropdown
export const tagDropdownTime = writable(0);
export const tagDropdownData = asyncDerived(
	[tagDropdownTime],
	getDropdownData<TagDropdownType>({
		url: urlGenerator({ address: '/(loggedIn)/dropdowns/tags' }).url,
		prefix: 'tags'
	})
);

// Category Dropdown
export const categoryDropdownTime = writable(0);
export const categoryDropdownData = asyncDerived(
	[categoryDropdownTime],
	getDropdownData<CategoryDropdownType>({
		url: urlGenerator({ address: '/(loggedIn)/dropdowns/categories' }).url,
		prefix: 'categories'
	})
);

// Bill Dropdown
export const billDropdownTime = writable(0);
export const billDropdownData = asyncDerived(
	[billDropdownTime],
	getDropdownData<BillDropdownType>({
		url: urlGenerator({ address: '/(loggedIn)/dropdowns/bills' }).url,
		prefix: 'bills'
	})
);

// Account Dropdown
export const accountDropdownTime = writable(0);
export const accountDropdownData = asyncDerived(
	[accountDropdownTime],
	getDropdownData<AccountDropdownType>({
		url: urlGenerator({ address: '/(loggedIn)/dropdowns/accounts' }).url,
		prefix: 'accounts'
	})
);

// Import Mapping Dropdown
export const importMappingDropdownTime = writable(0);
export const importMappingDropdownData = asyncDerived(
	[importMappingDropdownTime],
	getDropdownData<ImportMappingDropdownType>({
		url: urlGenerator({ address: '/(loggedIn)/dropdowns/importMappings' }).url,
		prefix: 'importMappings'
	})
);

// Budget Dropdown
export const budgetDropdownTime = writable(0);
export const budgetDropdownData = asyncDerived(
	[budgetDropdownTime],
	getDropdownData<BudgetDropdownType>({
		url: urlGenerator({ address: '/(loggedIn)/dropdowns/budgets' }).url,
		prefix: 'budgets'
	})
);

// Label Dropdown
export const labelDropdownTime = writable(0);
export const labelDropdownData = asyncDerived(
	[labelDropdownTime],
	getDropdownData<LabelDropdownType>({
		url: urlGenerator({ address: '/(loggedIn)/dropdowns/labels' }).url,
		prefix: 'labels'
	})
);
