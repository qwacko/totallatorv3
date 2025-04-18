import type { User } from '$lib/server/auth';
import { derived, writable } from 'svelte/store';

export const userInfoUpdateStore = writable<User | undefined>();

export const userInfoStore = derived(userInfoUpdateStore, ($userInfoStore) => {
	if (!$userInfoStore) {
		const returnData: User = {
			id: '',
			admin: false,
			currencyFormat: 'USD',
			dateFormat: 'YYYY-MM-DD',
			name: '',
			username: ''
		};

		return returnData;
	}
	return $userInfoStore;
});

export const currencyFormat = derived(userInfoStore, ($userInfoStore) => {
	return $userInfoStore.currencyFormat;
});

export const userDateFormat = derived(userInfoStore, ($userInfoStore) => {
	return $userInfoStore.dateFormat;
});
