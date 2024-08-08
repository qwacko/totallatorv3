<script lang="ts">
	import { Checkbox } from 'flowbite-svelte';
	import { untrack } from 'svelte';

	let {
		selectedIds = $bindable(),
		visibleIds,
		onlyVisibleAllowed = true
	}: {
		selectedIds: string[];
		visibleIds: string[];
		onlyVisibleAllowed?: boolean;
	} = $props();

	const allSelected = $derived(visibleIds.filter((id) => !selectedIds.includes(id)).length === 0);
	let checked = $state(selectedIds.length > 0);

	$effect(() => {
		if (selectedIds.length > 0 && !checked) {
			checked = true;
		}
		if (selectedIds.length === 0 && checked) {
			checked = false;
		}
	});

	const toggleAll = () => {
		if (allSelected) {
			selectedIds = [];
		} else {
			selectedIds = [...visibleIds];
		}
	};

	const filterSelected = (allowedIds: string[]) => {
		if (onlyVisibleAllowed) {
			selectedIds = allowedIds.filter((id) => selectedIds.includes(id));
		}
	};

	//On visible Ids being changed, update the selected IDs.
	$effect(() => {
		untrack(() => filterSelected)(visibleIds);
	});
</script>

<Checkbox bind:checked on:click={toggleAll} />
