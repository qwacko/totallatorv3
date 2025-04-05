<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { pwaInfo } from 'virtual:pwa-info';
	import { onMount } from 'svelte';
	import { authGuardFrontend } from '$lib/authGuard/authGuardConfig';
	import { dev } from '$app/environment';
	import { updatePageStore } from '$lib/prevPageStore';

	updatePageStore();

	const { data, children } = $props();

	$effect(() => {
		authGuardFrontend($page, { admin: data.user?.admin || false, user: data.user ? true : false });
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
