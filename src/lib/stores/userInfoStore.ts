import type { User } from 'lucia';
import { derived, writable } from 'svelte/store';

export const userInfoUpdateStore = writable<User | undefined>();

export const userInfoStore = derived(userInfoUpdateStore, ($userInfoStore) => {
	if (!$userInfoStore) {
		const returnData: User = {
			userId: '',
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
