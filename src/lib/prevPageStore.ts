import { afterNavigate } from '$app/navigation';
import { get, writable } from 'svelte/store';

export const pageStore = writable({ currentURL: '/', prevURL: '/' });

export const updatePageStore = () => {
	afterNavigate(({ to }) => {
		const currentURL = get(pageStore).currentURL;
		const toURL = to ? to.url.href : '/';
		if (toURL !== currentURL) {
			pageStore.set({ currentURL: toURL, prevURL: currentURL });
		}
	});

	return pageStore;
};
