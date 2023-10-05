<script lang="ts">
	import { Checkbox } from 'flowbite-svelte';

	export let selectedIds: string[];
	export let visibleIds: string[];
	export let onlyVisibleAllowed = true;

	$: checked = selectedIds.length > 0;
	$: allSelected = visibleIds.filter((id) => !selectedIds.includes(id)).length === 0;

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

<Checkbox {checked} on:click={toggleAll} />
