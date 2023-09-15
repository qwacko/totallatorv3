<script lang="ts">
	import '../app.postcss';
	import { page } from '$app/stores';
	import { pwaInfo } from 'virtual:pwa-info';
	import { onMount } from 'svelte';
	import { authGuardFrontend } from '$lib/authGuard/authGuardConfig';
	import { onNavigate } from '$app/navigation';
	import { dev } from '$app/environment';

	// onNavigate((navigation) => {
	// 	//@ts-expect-error startViewTransition is not defined on Document
	// 	if (!document.startViewTransition) return;

	// 	return new Promise((resolve) => {
	// 		//@ts-expect-error startViewTransition is not defined on Document
	// 		document.startViewTransition(async () => {
	// 			resolve();
	// 			await navigation.complete;
	// 		});
	// 	});
	// });

	export let data;

	$: authGuardFrontend($page, { admin: data.user?.admin || false, user: data.user ? true : false });

	onMount(async () => {
		if (pwaInfo && !dev) {
			const { registerSW } = await import('virtual:pwa-register');
			registerSW({
				immediate: true,
				onRegistered(r) {
					// uncomment following code if you want check for updates
					// r && setInterval(() => {
					//    console.log('Checking for sw update')
					//    r.update()
					// }, 20000 /* 20s for testing purposes */)
					console.log(`SW Registered: ${r}`);
				},
				onRegisterError(error) {
					console.log('SW registration error', error);
				}
			});
		}
	});

	$: webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '';
	$: user = $page.url.pathname.startsWith(`/users/${data?.user?.userId}`);
</script>

<svelte:head>
	{@html webManifestLink}
</svelte:head>
<slot />
