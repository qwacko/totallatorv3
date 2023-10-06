<script lang="ts">
	import CompleteIcon from '$lib/components/icons/CompleteIcon.svelte';
	import ReconciledIcon from '$lib/components/icons/ReconciledIcon.svelte';
	import DataCheckedIcon from '$lib/components/icons/DataCheckedIcon.svelte';

	import { Button } from 'flowbite-svelte';
	import { enhance } from '$app/forms';

	export let complete: boolean | undefined;
	export let reconciled: boolean | undefined;
	export let dataChecked: boolean | undefined;
	export let filter: Record<string, any> | undefined;
	export let prevPage: string;
	export let currentPage: string;
</script>

{#if filter}
	<form method="post" class="flex flex-col gap-2" action="?/updateState" use:enhance>
		<input type="hidden" name="filter" value={JSON.stringify(filter)} />
		<input type="hidden" name="prevPage" value={prevPage} />
		<input type="hidden" name="currentPage" value={currentPage} />
		<div class="flex flex-row gap-2">
			<Button
				type="submit"
				name="action"
				value="incomplete"
				class="flex-row gap-2  w-48"
				disabled={complete === false}
			>
				<CompleteIcon />Incomplete
			</Button>
			<Button
				type="submit"
				name="action"
				value="complete"
				class="flex-row gap-2 w-48"
				disabled={complete === true}
			>
				<CompleteIcon />Complete
			</Button>
		</div>
		<div class="flex flex-row gap-2">
			<Button
				type="submit"
				name="action"
				value="unreconciled"
				class="flex-row gap-2  w-48"
				disabled={reconciled === false}
			>
				<ReconciledIcon />Unreconciled
			</Button>
			<Button
				type="submit"
				name="action"
				value="reconciled"
				class="flex-row gap-2  w-48"
				disabled={reconciled === true}
			>
				<ReconciledIcon />Reconciled
			</Button>
		</div>

		<div class="flex flex-row gap-2">
			<Button
				type="submit"
				name="action"
				value="dataNotChecked"
				class="flex-row gap-2  w-48"
				disabled={dataChecked === false}
			>
				<DataCheckedIcon />Data Not Checked
			</Button>
			<Button
				type="submit"
				name="action"
				value="dataChecked"
				class="flex-row gap-2  w-48"
				disabled={dataChecked === true}
			>
				<DataCheckedIcon />Data Checked
			</Button>
		</div>
	</form>
{/if}
