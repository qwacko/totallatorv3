<script lang="ts">
	import { enhance } from '$app/forms';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { urlGenerator } from '$lib/routes.js';
	import { P, Button } from 'flowbite-svelte';

	export let data;
</script>

<CustomHeader pageTitle="Forget Import" filterText={data.info.importInfo.title} />

<PageLayout title="Forget Import" subtitle={data.info.importInfo.title}>
	<P>
		Forget import {data.info.importInfo.title}? This will remove references to the import, but leave
		all linked items.
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
