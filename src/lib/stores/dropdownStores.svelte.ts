import { urlGenerator } from '$lib/routes';
import type { TagDropdownType } from '$lib/server/db/actions/tagActions';
import type { CategoryDropdownType } from '$lib/server/db/actions/categoryActions';
import type { BillDropdownType } from '$lib/server/db/actions/billActions';
import type { AccountDropdownType } from '$lib/server/db/actions/accountActions';
import type { ImportMappingDropdownType } from '$lib/server/db/actions/importMappingActions';
import type { BudgetDropdownType } from '$lib/server/db/actions/budgetActions';
import type { LabelDropdownType } from '$lib/server/db/actions/labelActions';
import SuperJSON from 'superjson';
import { browser } from '$app/environment';
import { z } from 'zod';

const dropdownDataValidation = z.object({
	updatedTime: z.number(),
	storedTime: z.number(),
	data: z.array(z.any())
});

//Refresh Every Hour Even If No New Data Received
const maximumRefresh = 1000 * 60 * 60;

const getOrRefreshDropdownData = async <T extends Record<string, any>[]>({
	prefix,
	targetTime,
	url
}: {
	prefix: string;
	targetTime: number;
	url: string;
}): Promise<T> => {
	if (!browser) {
		const returnData = [] as unknown as T;
		return returnData;
	}
	const currentTime = targetTime;
	const nowTime = new Date().getTime();

	const dropdownStorageAddress = `${prefix}DropdownData`;

	const storedDropdown = window.localStorage.getItem(dropdownStorageAddress);

	const storedDropdownValidated = storedDropdown
		? dropdownDataValidation.safeParse(SuperJSON.parse(storedDropdown))
		: null;

	const dataIsValid =
		storedDropdownValidated && !storedDropdownValidated.error && storedDropdownValidated.data.data;

	const needsRefresh =
		!dataIsValid ||
		!storedDropdownValidated ||
		currentTime > storedDropdownValidated.data.updatedTime ||
		storedDropdownValidated.data.storedTime + maximumRefresh < nowTime;

	if (needsRefresh) {
		console.log(`Updating ${prefix} dropdown data...`);
		if (!dataIsValid) {
			console.log(`No valid data found for ${prefix} dropdown data...`);
		}
		if (!storedDropdownValidated) {
			console.log(`No stored data found for ${prefix} dropdown data...`);
		}
		if (storedDropdownValidated?.data && currentTime > storedDropdownValidated.data.updatedTime) {
			console.log(`Data is outdated for ${prefix} dropdown data...`);
		}
		if (
			storedDropdownValidated?.data &&
			storedDropdownValidated.data.storedTime + maximumRefresh < nowTime
		) {
			console.log(`Data is older than maximum refresh time for ${prefix} dropdown data...`);
		}

		const data = await fetch(url);
		const dropdownText = await data.text();
		const dropdownData = SuperJSON.parse(dropdownText) as T;

		window.localStorage.setItem(
			dropdownStorageAddress,
			SuperJSON.stringify({ updatedTime: currentTime, storedTime: nowTime, data: dropdownData })
		);

		return dropdownData;
	}

	return storedDropdownValidated.data.data as unknown as T;
};

const getDropdownData = <T extends Record<string, any>[]>({
	url,
	prefix,
	updateValue
}: {
	url: string;
	prefix: string;
	updateValue: (value: T) => void;
}) => {
	return (newDataTime: number): void => {
		if (!browser) {
			const returnData = [] as unknown as T;
			updateValue(returnData);
		}

		getOrRefreshDropdownData<T>({ prefix, targetTime: newDataTime, url }).then((newValue) => {
			updateValue(newValue);
		});
	};
};

// Tag Dropdown
export let tagDropdownData = $state<{ value: TagDropdownType | undefined }>({ value: undefined });
export const tagDropdownUpdateData = getDropdownData<TagDropdownType>({
	url: urlGenerator({ address: '/(loggedIn)/dropdowns/tags' }).url,
	prefix: 'tags',
	updateValue: (newValue) => (tagDropdownData.value = newValue)
});

// Category Dropdown
export let categoryDropdownData = $state<{ value: CategoryDropdownType | undefined }>({
	value: undefined
});
export const categoryDropdownUpdateData = getDropdownData<CategoryDropdownType>({
	url: urlGenerator({ address: '/(loggedIn)/dropdowns/categories' }).url,
	prefix: 'categories',
	updateValue: (newValue) => (categoryDropdownData.value = newValue)
});

// Bill Dropdown
export let billDropdownData = $state<{ value: BillDropdownType | undefined }>({ value: undefined });
export const billDropdownUpdateData = getDropdownData<BillDropdownType>({
	url: urlGenerator({ address: '/(loggedIn)/dropdowns/bills' }).url,
	prefix: 'bills',
	updateValue: (newValue) => (billDropdownData.value = newValue)
});

// Account Dropdown
export let accountDropdownData = $state<{ value: AccountDropdownType | undefined }>({
	value: undefined
});
export const accountDropdownUpdateData = getDropdownData<AccountDropdownType>({
	url: urlGenerator({ address: '/(loggedIn)/dropdowns/accounts' }).url,
	prefix: 'accounts',
	updateValue: (newValue) => (accountDropdownData.value = newValue)
});

// Import Mapping Dropdown
export let budgetDropdownData = $state<{ value: ImportMappingDropdownType | undefined }>({
	value: undefined
});
export const budgetDropdownUpdateData = getDropdownData<BudgetDropdownType>({
	url: urlGenerator({ address: '/(loggedIn)/dropdowns/budgets' }).url,
	prefix: 'budgets',
	updateValue: (newValue) => (budgetDropdownData.value = newValue)
});

// Label Dropdown
export let labelDropdownData = $state<{ value: LabelDropdownType | undefined }>({
	value: undefined
});
export const labelDropdownUpdateData = getDropdownData<LabelDropdownType>({
	url: urlGenerator({ address: '/(loggedIn)/dropdowns/labels' }).url,
	prefix: 'labels',
	updateValue: (newValue) => (labelDropdownData.value = newValue)
});

// Import Mapping Dropdown
export let importMappingDropdownData = $state<{ value: ImportMappingDropdownType | undefined }>({
	value: undefined
});
export const importMappingDropdownUpdateData = getDropdownData<ImportMappingDropdownType>({
	url: urlGenerator({ address: '/(loggedIn)/dropdowns/importMappings' }).url,
	prefix: 'importMapping',
	updateValue: (newValue) => (importMappingDropdownData.value = newValue)
});
