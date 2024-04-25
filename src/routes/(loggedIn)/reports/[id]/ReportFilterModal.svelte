<script lang="ts">
	import FilterModal from '$lib/components/FilterModal.svelte';
	import { Button } from 'flowbite-svelte';
	import type { JournalFilterSchemaWithoutPaginationType } from '$lib/schema/journalSchema';
	import { enhance } from '$app/forms';
	import { defaultCustomEnhance } from '$lib/helpers/customEnhance';

	export let filter: JournalFilterSchemaWithoutPaginationType | undefined;

	let filterModalOpened = false;
	let loading = false;
</script>

<FilterModal
	modalTitle="Report Journal Filter"
	bind:opened={filterModalOpened}
	currentFilter={filter ? filter : {}}
	hideDates={false}
>
	<svelte:fragment slot="footerContents" let:activeFilter>
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
	</svelte:fragment>
</FilterModal>
