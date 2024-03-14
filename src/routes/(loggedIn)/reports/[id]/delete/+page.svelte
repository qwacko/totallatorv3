<script lang="ts">
	import { enhance } from '$app/forms';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import PrevPageButton from '$lib/components/PrevPageButton.svelte';
	import { customEnhance } from '$lib/helpers/customEnhance';
	import ActionButton from '$lib/components/ActionButton.svelte';

	export let data;

	let loading = false;
</script>

<CustomHeader pageTitle="Delete Report" filterText={data.reportInfo.title} />

<PageLayout title={data.reportInfo.title} size="sm">
	<form
		method="POST"
		class="flex flex-col gap-2"
		use:enhance={customEnhance({
			updateLoading: (newValue) => (loading = newValue)
		})}
	>
		<div class="flex">Are you sure you want to delete report {data.reportInfo.title}?</div>

		<div class="flex flex-row gap-4 pt-4">
			<PrevPageButton class="flex flex-grow" outline>Cancel</PrevPageButton>
			<ActionButton
				{loading}
				message="Delete"
				loadingMessage="Deleting..."
				class="flex flex-grow"
				color="red"
				type="submit"
			/>
		</div>
	</form>
</PageLayout>
