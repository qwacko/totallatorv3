<script lang="ts">
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { Badge } from 'flowbite-svelte';
	import ActionButton from '$lib/components/ActionButton.svelte';
	import { formFieldProxy, superForm } from 'sveltekit-superforms';
	import AutoImportForm from '../AutoImportForm.svelte';
	import type { AutoImportFormProxy } from '../autoImportFormProxy';

	const { data } = $props();

	const form = superForm(data.form);

	const proxyForm: AutoImportFormProxy = {
		title: formFieldProxy(form, 'title'),
		enabled: formFieldProxy(form, 'enabled'),
		importMappingId: formFieldProxy(form, 'importMappingId'),
		frequency: formFieldProxy(form, 'frequency'),
		type: formFieldProxy(form, 'type'),
		accountId: formFieldProxy(form, 'accountId'),
		appAccessToken: formFieldProxy(form, 'appAccessToken'),
		appId: formFieldProxy(form, 'appId'),
		connectionId: formFieldProxy(form, 'connectionId'),
		lookbackDays: formFieldProxy(form, 'lookbackDays'),
		secret: formFieldProxy(form, 'secret'),
		startDate: formFieldProxy(form, 'startDate'),
		userAccessToken: formFieldProxy(form, 'userAccessToken'),
		autoProcess: formFieldProxy(form, 'autoProcess'),
		autoClean: formFieldProxy(form, 'autoClean')
	};

	const message = $derived(form.message);
	const enhance = $derived(form.enhance);

	let importing = $state(false);
</script>

<CustomHeader pageTitle="New Auto Import" />

<PageLayout title="New Auto Imports">
	{#if $message && $message.length > 0}
		<Badge>Error : {$message}</Badge>
	{/if}
	<form use:enhance method="post" class="flex flex-col gap-2">
		<AutoImportForm {proxyForm} disabled={importing} />

		<ActionButton type="submit" loading={importing} message="Create" loadingMessage="Creating..." />
	</form>
</PageLayout>
