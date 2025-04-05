<script lang="ts">
	import { Button, P } from 'flowbite-svelte';
	import { onError, onSuccess } from '$lib/stores/notificationHelpers';
	import { urlGenerator } from '$lib/routes';
	import type { ReportElementData } from '$lib/server/db/actions/reportActions';
	import FilterModal from '../FilterModal.svelte';
	import { customEnhance } from '$lib/helpers/customEnhance';
	import { notificationStore } from '$lib/stores/notificationStore';
	import { enhance } from '$app/forms';
	import ActionButton from '../ActionButton.svelte';

	const { elementData }: { elementData: ReportElementData } = $props();

	const locked = $derived(elementData && elementData.reportElementConfig.locked);
	let loading = $state<boolean[]>([]);
	let removeLoading = $state<boolean[]>([]);
	let addLoading = $state(false);
	let filterOpen = $state<boolean[]>([]);
</script>

{#if elementData}
	<div class="w-full flex-col items-stretch gap-2">
		{#each elementData.reportElementConfig.filters as currentFilter, index}
			<div class="flex flex-row items-center gap-2">
				<div class="flex">
					Filter {currentFilter.order}
				</div>
				<FilterModal
					currentFilter={currentFilter.filter.filter}
					bind:opened={filterOpen[index]}
					hideDates
				>
					{#snippet slotFooterContents({ activeFilter })}
						<Button on:click={() => (filterOpen[index] = false)} outline>Cancel</Button>
						<div class="grow"></div>
						<form
							action="{urlGenerator({
								address: '/(loggedIn)/reports/element/[id]',
								paramsValue: { id: elementData.id }
							}).url}?/updateConfigFilter"
							method="POST"
							use:enhance={customEnhance({
								updateLoading: (value) => (loading[index] = value),
								onSuccess: () => {
									filterOpen[index] = false;
									notificationStore.send({
										type: 'success',
										message: 'Filter updated successfully',
										duration: 2000
									});
								},
								onError: onError('Error updating filter'),
								onFailure: onError('Error updating filter')
							})}
						>
							<input type="hidden" name="filterText" value={JSON.stringify(activeFilter)} />
							<input type="hidden" name="filterId" value={currentFilter.filter.id} />
							<ActionButton
								type="submit"
								disabled={locked}
								loading={loading[index]}
								message="Update Filter"
								loadingMessage="Updating Filter..."
							/>
						</form>
					{/snippet}
				</FilterModal>
				<form
					action="{urlGenerator({
						address: '/(loggedIn)/reports/element/[id]',
						paramsValue: { id: elementData.id }
					}).url}?/removeConfigFilter"
					method="POST"
					use:enhance={customEnhance({
						updateLoading: (value) => (removeLoading[index] = value),
						onSuccess: onSuccess('Filter removed successfully'),
						onError: onError('Error removing filter'),
						onFailure: onError('Error removing filter')
					})}
				>
					<input type="hidden" name="filterId" value={currentFilter.filter.id} />
					<ActionButton
						type="submit"
						color="red"
						size="sm"
						outline
						disabled={locked}
						loading={removeLoading[index]}
						message="Remove Filter"
						loadingMessage="Removing Filter..."
					/>
				</form>
				<P>Filter : {currentFilter.filter.filterText}</P>
			</div>
		{/each}
	</div>
	<form
		action="{urlGenerator({
			address: '/(loggedIn)/reports/element/[id]',
			paramsValue: { id: elementData.id }
		}).url}?/addConfigFilter"
		method="POST"
		use:enhance={customEnhance({
			updateLoading: (value) => (addLoading = value),
			onSuccess: onSuccess('Filter added successfully'),
			onError: onError('Error adding filter'),
			onFailure: onError('Error adding filter')
		})}
	>
		<ActionButton
			type="submit"
			disabled={locked}
			message="Add Filter"
			loadingMessage="Adding Filter..."
			loading={addLoading}
		/>
	</form>
{/if}
