<script lang="ts">
	import CompleteIcon from '$lib/components/icons/CompleteIcon.svelte';
	import ReconciledIcon from '$lib/components/icons/ReconciledIcon.svelte';
	import DataCheckedIcon from '$lib/components/icons/DataCheckedIcon.svelte';
	import { pageStore } from '$lib/prevPageStore';

	import { Button, ButtonGroup } from 'flowbite-svelte';
	import { enhance } from '$app/forms';

	const {
		complete,
		reconciled,
		dataChecked,
		filter,
		currentPage,
		canEdit
	}: {
		complete: boolean | undefined;
		reconciled: boolean | undefined;
		dataChecked: boolean | undefined;
		filter: Record<string, any> | undefined;
		currentPage: string;
		canEdit: boolean;
	} = $props();
</script>

{#if filter}
	<form method="post" action="?/updateState" use:enhance>
		<input type="hidden" name="filter" value={JSON.stringify(filter)} />
		<input type="hidden" name="prevPage" value={$pageStore.prevURL} />
		<input type="hidden" name="currentPage" value={currentPage} />
		<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
			<ButtonGroup class="flex flex-row">
				<Button
					type="submit"
					name="action"
					value="incomplete"
					class="flex-grow basis-0 flex-row gap-2"
					disabled={complete === false}
				>
					<CompleteIcon />Incomplete
				</Button>
				<Button
					type="submit"
					name="action"
					value="complete"
					class="flex-grow basis-0 flex-row gap-2"
					disabled={complete === true}
				>
					<CompleteIcon />Complete
				</Button>
			</ButtonGroup>
			<ButtonGroup class="flex flex-row">
				<Button
					type="submit"
					name="action"
					value="unreconciled"
					class="flex-grow basis-0 flex-row gap-2"
					disabled={reconciled === false || !canEdit}
				>
					<ReconciledIcon />Unreconciled
				</Button>
				<Button
					type="submit"
					name="action"
					value="reconciled"
					class="flex-grow basis-0 flex-row gap-2"
					disabled={reconciled === true || !canEdit}
				>
					<ReconciledIcon />Reconciled
				</Button>
			</ButtonGroup>
			<ButtonGroup class="flex flex-row">
				<Button
					type="submit"
					name="action"
					value="dataNotChecked"
					class="flex-grow basis-0 flex-row gap-2"
					disabled={dataChecked === false || !canEdit}
				>
					<DataCheckedIcon />Data Not Checked
				</Button>
				<Button
					type="submit"
					name="action"
					value="dataChecked"
					class="flex-grow basis-0 flex-row gap-2"
					disabled={dataChecked === true || !canEdit}
				>
					<DataCheckedIcon />Data Checked
				</Button>
			</ButtonGroup>
		</div>
	</form>
{/if}
