<script lang="ts">
	import { onMount } from 'svelte';
	import { pwaInfo } from 'virtual:pwa-info';

	import { dev } from '$app/environment';
	import { page } from '$app/state';

	import { authGuardFrontend } from '$lib/authGuard/authGuardConfig';
	import { updatePageStore } from '$lib/prevPageStore';

	import '../app.css';

	updatePageStore();

	const { data, children } = $props();

	$effect(() => {
		authGuardFrontend(page, {
			admin: data.user?.admin || false,
			user: data.user ? true : false
		});
	});

	onMount(async () => {
		if (pwaInfo && !dev) {
			const { registerSW } = await import('virtual:pwa-register');
			registerSW({
				immediate: true,
				onRegistered(r) {
					console.log(`SW Registered: ${r}`);
				},
				onRegisterError(error) {
					console.log('SW registration error', error);
				}
			});
		}
	});

	let webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '';
</script>

<svelte:head>
	{@html webManifestLink}
</svelte:head>
{@render children()}
