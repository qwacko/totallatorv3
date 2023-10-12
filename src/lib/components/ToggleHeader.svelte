<script lang="ts">
	import { Checkbox } from 'flowbite-svelte';

	export let selectedIds: string[];
	export let visibleIds: string[];
	export let onlyVisibleAllowed = true;

	$: allSelected = visibleIds.filter((id) => !selectedIds.includes(id)).length === 0;
	let checked = selectedIds.length > 0;

	$: if (selectedIds.length > 0 && !checked) {
		checked = true;
	}
	$: if (selectedIds.length === 0 && checked) {
		checked = false;
	}

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
	$: filterSelected(visibleIds);
</script>

<Checkbox bind:checked on:click={toggleAll} />
