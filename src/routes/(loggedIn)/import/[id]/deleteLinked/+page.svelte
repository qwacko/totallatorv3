<script lang="ts">
	import { enhance } from '$app/forms';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { urlGenerator } from '$lib/routes.js';
	import { P, Button } from 'flowbite-svelte';

	export let data;
</script>

<CustomHeader pageTitle="Delete Import Linked Items" filterText={data.info.importInfo.title} />

<PageLayout title="Delete Import Linked Items" subtitle={data.info.importInfo.title}>
	<P>
		Delete items linked to import {data.info.importInfo.title}? This will leave the import for
		future reuse.
	</P>
	<Button
		href={urlGenerator({ address: '/(loggedIn)/import/[id]', paramsValue: { id: data.id } }).url}
	>
		Cancel
	</Button>
	<form method="post" use:enhance class="flex w-full">
		<Button color="red" type="submit" class="flex w-full">Delete Linked Items</Button>
	</form>
</PageLayout>
