import { get, writable } from 'svelte/store';

import { afterNavigate } from '$app/navigation';

export const pageStore = writable({
	currentURL: '/',
	prevURL: '/'
});

export const routeStore = writable({
	currentRoute: '/',
	prevRoute: '/',
	prevRouteURL: '/',
	currentRouteURL: '/'
});

export const updatePageStore = () => {
	afterNavigate(({ to }) => {
		const currentURL = get(pageStore).currentURL;
		const toURL = to ? to.url.href : '/';
		if (toURL !== currentURL) {
			pageStore.set({ currentURL: toURL, prevURL: currentURL });
		}
		const currentRoute = get(routeStore).currentRoute;
		const currentRouteURL = get(routeStore).currentRouteURL;
		const toRoute = to?.route.id || currentRoute;
		if (toRoute !== currentRoute) {
			routeStore.set({
				prevRoute: currentRoute,
				prevRouteURL: currentRouteURL,
				currentRoute: toRoute,
				currentRouteURL: toURL
			});
		} else if (toURL !== currentRouteURL) {
			routeStore.update((r) => ({ ...r, currentRouteURL: toURL }));
		}
	});

	return pageStore;
};
