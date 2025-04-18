<script lang="ts">
	import {
		ArrowKeyDown,
		ArrowKeyUp,
		Button,
		Dropdown,
		DropdownDivider,
		DropdownItem
	} from 'flowbite-svelte';
	import DeleteIcon from '../icons/DeleteIcon.svelte';
	import ColumnOrderIcon from '../icons/ColumnOrderIcon.svelte';

	let {
		columnIds = [],
		shownColumns = $bindable([]),
		columnIdToTitle
	}: {
		columnIds: string[];
		shownColumns: string[];
		columnIdToTitle: (columnId: string) => string;
	} = $props();

	const addColumnToShownColumns = (columnId: string) => {
		if (!shownColumns.includes(columnId)) {
			shownColumns = [...shownColumns, columnId];
		}
	};

	const removeColumnFromShownColumns = (columnId: string) => {
		if (shownColumns.includes(columnId)) {
			shownColumns = shownColumns.filter((c) => c !== columnId);
		}
	};

	const moveColumnUp = (columnId: string) => {
		const index = shownColumns.indexOf(columnId);
		if (index > 0) {
			const newShownColumns = [...shownColumns];

			newShownColumns[index] = shownColumns[index - 1];
			newShownColumns[index - 1] = shownColumns[index];

			shownColumns = [...newShownColumns];
		}
	};

	const moveColumnDown = (columnId: string) => {
		const index = shownColumns.indexOf(columnId);
		if (index < shownColumns.length - 1) {
			const newShownColumns = [...shownColumns];
			newShownColumns[index] = newShownColumns[index + 1];
			newShownColumns[index + 1] = columnId;
			shownColumns = newShownColumns;
		}
	};

	const remainingColumns = $derived(columnIds.filter((c) => !shownColumns.includes(c)));
</script>

<Button class="flex p-2" outline><ColumnOrderIcon /></Button>
<Dropdown>
	{#each shownColumns as currentColumn}
		<DropdownItem>
			<div class="flex flex-row gap-2">
				<div class="flex grow pr-8">{columnIdToTitle(currentColumn)}</div>
				<Button class="border-0 p-1" outline on:click={() => moveColumnUp(currentColumn)}>
					<ArrowKeyUp />
				</Button>
				<Button class="border-0 p-1" outline on:click={() => moveColumnDown(currentColumn)}>
					<ArrowKeyDown />
				</Button>
				<Button
					class="border-0 p-1"
					outline
					on:click={() => removeColumnFromShownColumns(currentColumn)}
				>
					<DeleteIcon />
				</Button>
			</div>
		</DropdownItem>
	{/each}
	<DropdownDivider />
	{#each remainingColumns as currentColumn}
		<DropdownItem on:click={() => addColumnToShownColumns(currentColumn)}>
			{columnIdToTitle(currentColumn)}
		</DropdownItem>
	{/each}
</Dropdown>
