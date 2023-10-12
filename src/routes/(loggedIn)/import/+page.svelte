<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { urlGenerator } from '$lib/routes';
	import { Button } from 'flowbite-svelte';
</script>

<PageLayout title="Import">
	<svelte:fragment slot="right">
		<Button color="light" href={urlGenerator({ address: '/(loggedIn)/import/create' }).url} outline>
			Add
		</Button>
	</svelte:fragment>
	<p>Import</p>
</PageLayout>
