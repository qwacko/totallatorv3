<script lang="ts">
	import { Button } from 'flowbite-svelte';

	import { enhance } from '$app/forms';

	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';
	import PrevPageButton from '$lib/components/PrevPageButton.svelte';

	const { data } = $props();
</script>

<CustomHeader pageTitle="Delete Import Mapping" filterText={data.importMapping.title} />

<PageLayout title="Delete Reusable Filter" size="sm">
	<form method="POST" class="flex flex-col gap-2" use:enhance>
		<PreviousUrlInput name="prevPage" />
		<div class="flex">
			Are you sure you want to delete import mapping : {data.importMapping.title}?
		</div>

		<div class="flex flex-row gap-4 pt-4">
			<PrevPageButton class="flex grow" outline>Cancel</PrevPageButton>
			<Button type="submit" color="red" class="flex grow">Delete</Button>
		</div>
	</form>
</PageLayout>
