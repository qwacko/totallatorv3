<script lang="ts">
	import { enhance } from '$app/forms';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import PrevPageButton from '$lib/components/PrevPageButton.svelte';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';
	import { Button } from 'flowbite-svelte';

	export let data;
</script>

<CustomHeader pageTitle="Delete Reusable Filter" filterText={data.filter.title} />

<PageLayout title="Delete Reusable Filter" size="sm">
	<form method="POST" class="flex flex-col gap-2" use:enhance>
		<PreviousUrlInput name="prevPage" />
		<div class="flex">Are you sure you want to delete reusable filter : {data.filter.title}?</div>

		<div class="flex flex-row gap-4 pt-4">
			<PrevPageButton class="flex flex-grow" outline>Cancel</PrevPageButton>
			<Button type="submit" color="red" class="flex flex-grow">Delete</Button>
		</div>
	</form>
</PageLayout>
