<script lang="ts">
	import FilterModal from '$lib/components/FilterModal.svelte';
	import { Button } from 'flowbite-svelte';
	import type { JournalFilterSchemaWithoutPaginationType } from '$lib/schema/journalSchema';
	import { enhance } from '$app/forms';
	import { defaultCustomEnhance } from '$lib/helpers/customEnhance';

	const {filter}:{filter: JournalFilterSchemaWithoutPaginationType | undefined} = $props();

	let filterModalOpened = $state(false);
	let loading = $state(false);
</script>

<FilterModal
	modalTitle="Report Journal Filter"
	bind:opened={filterModalOpened}
	currentFilter={filter ? filter : {}}
	hideDates={false}
>
	{#snippet slotFooterContents({activeFilter})}
		<form
			action="?/updateFilter"
			method="post"
			use:enhance={defaultCustomEnhance({
				updateLoading: (newLoading) => (loading = newLoading),
				onSuccess: () => (filterModalOpened = false)
			})}
		>
			<input type="hidden" name="filter" value={JSON.stringify(activeFilter)} />
			<Button on:click={() => (filterModalOpened = false)} outline>Cancel</Button>
			<Button type="submit" disabled={loading}>Update</Button>
		</form>
	{/snippet}
</FilterModal>
