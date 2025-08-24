<script lang="ts">
	import { Button, P } from 'flowbite-svelte';

	import { type JournalFilterSchemaType } from '@totallator/shared';
	import { defaultJournalFilter } from '@totallator/shared';

	import { enhance } from '$app/forms';

	import FilterModal from '$lib/components/FilterModal.svelte';
	import JournalEntryIcon from '$lib/components/icons/JournalEntryIcon.svelte';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';
	import { customEnhance } from '$lib/helpers/customEnhance';
	import { urlGenerator } from '$lib/routes.js';

	let {
		filter,
		filterModal = $bindable(false),
		id,
		numberResults,
		filterText
	}: {
		filter: JournalFilterSchemaType | undefined;
		filterModal?: boolean;
		id: string;
		numberResults: number;
		filterText: string[] | undefined;
	} = $props();
</script>

<input type="hidden" name="id" value={id} />
<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
	<div class="flex flex-col gap-2">
		<P class="self-center" weight="semibold">Filter</P>
		<div class="flex flex-row items-center gap-6 self-center">
			<div class="flex flex-col gap-1">
				<FilterModal currentFilter={filter || defaultJournalFilter()} bind:opened={filterModal}>
					{#snippet slotFooterContents({ activeFilter })}
						<Button onclick={() => (filterModal = false)} outline>Cancel</Button>
						<div class="grow"></div>

						<form
							method="post"
							action="?/updateFilter"
							use:enhance={customEnhance({
								onSuccess: () => {
									filterModal = false;
								}
							})}
						>
							<input type="hidden" name="filter" value={JSON.stringify(activeFilter)} />
							<PreviousUrlInput name="prevPage" routeBased />
							<Button type="submit">Apply</Button>
						</form>
					{/snippet}
				</FilterModal>
				<Button
					href={urlGenerator({
						address: '/(loggedIn)/journals',
						searchParamsValue: filter || defaultJournalFilter()
					}).url}
					color="blue"
					outline
					size="sm"
				>
					<JournalEntryIcon />
				</Button>
			</div>
			<div class="flex flex-col gap-1">
				{#if filterText}
					{#each filterText as currentFilterText}
						<div class="flex">{currentFilterText}</div>
					{/each}
				{/if}
				<div class="flex text-gray-400">{numberResults} matching journals</div>
			</div>
		</div>
	</div>
</div>
