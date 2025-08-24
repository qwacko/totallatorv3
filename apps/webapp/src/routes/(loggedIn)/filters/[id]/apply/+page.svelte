<script lang="ts">
	import { Button, P } from 'flowbite-svelte';

	import { enhance } from '$app/forms';

	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';

	const { data } = $props();
</script>

<CustomHeader pageTitle="Apply Reusable Filter {data.filter.title}" />

<form method="post" use:enhance>
	<PreviousUrlInput name="prevPage" />
	<PageLayout title="Update Reusable Filter {data.filter.title}" size="lg">
		<P>
			Are you sure you want to apply filter {data.filter.title}?
		</P><P>
			This will modify all journals that match
			{data.filter.filterText} and set the values to {data.filter.changeText}? This will impact {data
				.filter.journalCount} journals.
		</P>
		<Button type="submit" color="blue">Apply</Button>
		<Button onclick={() => history.back()} color="light" outline>Cancel</Button>
	</PageLayout>
</form>
