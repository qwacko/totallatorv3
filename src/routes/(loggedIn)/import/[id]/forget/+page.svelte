<script lang="ts">
	import { enhance } from '$app/forms';
	import ActionButton from '$lib/components/ActionButton.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { urlGenerator } from '$lib/routes.js';
	import { P, Button } from 'flowbite-svelte';
	import { customEnhance } from '$lib/helpers/customEnhance';

	const { data } = $props();

	let loading = $state(false);
</script>

<CustomHeader pageTitle="Forget Import" filterText={data.info.importInfo.import.title} />

<PageLayout title="Forget Import" subtitle={data.info.importInfo.import.title}>
	<P>
		Forget import {data.info.importInfo.import.title}? This will remove references to the import,
		but leave all linked items.
	</P>
	<Button
		href={urlGenerator({ address: '/(loggedIn)/import/[id]', paramsValue: { id: data.id } }).url}
	>
		Cancel
	</Button>
	<form
		method="post"
		use:enhance={customEnhance({ updateLoading: (newLoading) => (loading = newLoading) })}
		class="flex w-full"
	>
		<ActionButton
			{loading}
			color="red"
			type="submit"
			class="flex w-full"
			message="Forget Import"
			loadingMessage="Forgetting..."
		/>
	</form>
</PageLayout>
