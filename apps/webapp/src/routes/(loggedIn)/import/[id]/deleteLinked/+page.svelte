<script lang="ts">
	import { Button, P } from 'flowbite-svelte';

	import { enhance } from '$app/forms';

	import ActionButton from '$lib/components/ActionButton.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { customEnhance } from '$lib/helpers/customEnhance';
	import { urlGenerator } from '$lib/routes.js';

	const { data } = $props();

	let loading = $state(false);
</script>

<CustomHeader
	pageTitle="Delete Import Linked Items"
	filterText={data.info.importInfo.import.title}
/>

<PageLayout title="Delete Import Linked Items" subtitle={data.info.importInfo.import.title}>
	<P>
		Delete items linked to import {data.info.importInfo.import.title}? This will leave the import
		for future reuse.
	</P>
	<Button
		href={urlGenerator({
			address: '/(loggedIn)/import/[id]',
			paramsValue: { id: data.id }
		}).url}
	>
		Cancel
	</Button>
	<form
		method="post"
		use:enhance={customEnhance({
			updateLoading: (newLoading) => (loading = newLoading)
		})}
		class="flex w-full"
	>
		<ActionButton
			color="red"
			{loading}
			type="submit"
			class="flex w-full"
			message="Delete Linked Items"
			loadingMessage="Deleting..."
		/>
	</form>
</PageLayout>
