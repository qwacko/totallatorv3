<script lang="ts">
	import { enhance } from '$app/forms';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { urlGenerator } from '$lib/routes.js';
	import { P, Button } from 'flowbite-svelte';

	export let data;
</script>

<PageLayout title="Delete Import" subtitle={data.info.importInfo.title}>
	<P>
		Delete import {data.info.importInfo.title}? This will remove references to the import and any
		linked items.
	</P>
	<Button
		href={urlGenerator({ address: '/(loggedIn)/import/[id]', paramsValue: { id: data.id } }).url}
	>
		Cancel
	</Button>
	<form method="post" use:enhance class="flex w-full">
		<Button color="red" type="submit" class="flex w-full">Forget Import</Button>
	</form>
</PageLayout>
