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
	let checked = $derived(selectedIds.length > 0);

	const toggleAll = () => {
		if (allSelected) {
			selectedIds = [];
		} else {
			selectedIds = [...visibleIds];
		}
	};

	//On visible Ids being changed, update the selected IDs.
	$effect(() => {
		if (onlyVisibleAllowed) {
			const idsToDrop = selectedIds.filter((id) => !visibleIds.includes(id));

			if (idsToDrop.length > 0) {
				selectedIds = selectedIds.filter((id) => visibleIds.includes(id));
			}
		}
	});
</script>

<Checkbox {checked} on:click={toggleAll} />
